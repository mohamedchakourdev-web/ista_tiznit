<?php

declare(strict_types=1);

namespace App\Http\Controllers\API\Management;

use App\Enums\AutorisationStatutEnum;
use App\Http\Controllers\Controller;
use App\Http\Requests\Management\StoreAutorisationRequest;
use App\Http\Resources\AutorisationResource;
use App\Models\Absence;
use App\Models\Autorisation;
use App\Models\Notification;
use App\Models\Stagiaire;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Throwable;

class AutorisationController extends Controller
{
    /**
     * Liste des autorisations.
     */
    public function index(Request $request): JsonResponse
    {
        $user = auth()->user();

        $query = Autorisation::with([
            'absence.stagiaire.groupe',
            'absence.groupe.filiere',
            'absences.groupe',
            'stagiaire.groupe.filiere',
            'targetUser',
            'validatedByUser',
        ])->orderByDesc('created_at');

        if ($request->statut) {
            $query->where('statut', (string) $request->statut);
        }

        if ($request->is_read !== null && $request->is_read !== '') {
            $isRead = filter_var($request->is_read, FILTER_VALIDATE_BOOL);
            $query->where('is_read', $isRead);
        }

        // Recherche texte libre
        $term = trim((string) $request->search);

        if ($term !== '') {
            $search = '%'.$term.'%';

            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', $search)
                    ->orWhereHas('stagiaire', function ($stagiaireQuery) use ($search) {
                        $stagiaireQuery->where('nom', 'like', $search)
                            ->orWhere('prenom', 'like', $search)
                            ->orWhere('cef', 'like', $search)
                            ->orWhere(DB::raw("concat(nom, ' ', prenom)"), 'like', $search);
                    })
                    ->orWhereHas('absence.stagiaire', function ($stagiaireQuery) use ($search) {
                        $stagiaireQuery->where('nom', 'like', $search)
                            ->orWhere('prenom', 'like', $search)
                            ->orWhere('cef', 'like', $search)
                            ->orWhere(DB::raw("concat(nom, ' ', prenom)"), 'like', $search);
                    })
                    ->orWhereHas('absence.groupe', function ($groupeQuery) use ($search) {
                        $groupeQuery->where('nom', 'like', $search)
                            ->orWhere('code', 'like', $search);
                    })
                    ->orWhereHas('stagiaire.groupe', function ($groupeQuery) use ($search) {
                        $groupeQuery->where('nom', 'like', $search)
                            ->orWhere('code', 'like', $search);
                    })
                    ->orWhereHas('targetUser', function ($userQuery) use ($search) {
                        $userQuery->where('nom', 'like', $search)
                            ->orWhere('prenom', 'like', $search);
                    });
            });
        }

        $autorisations = $query->paginate($this->perPage($request));

        return $this->paginatedResponse(
            AutorisationResource::collection($autorisations),
            'Liste des autorisations',
        );
    }

    /**
     * Détails d'une autorisation.
     */
    public function show(Request $request, int $autorisationId): JsonResponse
    {
        $user = auth()->user();

        $autorisation = Autorisation::with([
            'absence.stagiaire.groupe.filiere',
            'absence.groupe.formateurs',
            'absences.stagiaire.groupe.filiere',
            'absences.groupe',
            'stagiaire.groupe.formateurs',
            'targetUser',
            'validatedByUser',
        ])->findOrFail($autorisationId);

        return response()->json([
            'success' => true,
            'message' => 'Détails de l autorisation',
            'data' => new AutorisationResource($autorisation),
        ]);
    }

    /**
     * Créer une autorisation.
     */
    public function store(StoreAutorisationRequest $request): JsonResponse
    {
        $user = auth()->user();

        $data = $request->validated();

        $absenceIds = $this->resolveAbsenceIds($data);

        DB::beginTransaction();

        try {
            $absences = $absenceIds !== []
                ? Absence::with('stagiaire.groupe.formateurs')->whereKey($absenceIds)->get()
                : collect();

            $stagiaire = null;

            if (! empty($data['stagiaire_id'])) {
                $stagiaire = Stagiaire::with('groupe.formateurs')
                    ->findOrFail((int) $data['stagiaire_id']);
            } elseif ($absences->isNotEmpty()) {
                $stagiaire = $absences->first()->stagiaire;
            }

            if ($stagiaire === null) {
                $stagiaire = Stagiaire::with('groupe.formateurs')
                    ->findOrFail((int) ($data['stagiaire_id'] ?? 0));
            }

            $formateur = User::where('id', (int) $data['target_user_id'])
                ->where('is_active', true)
                ->role('formateur')
                ->firstOrFail();

            $statut = $data['statut'] ?? AutorisationStatutEnum::EnAttente->value;
            $isDecisionStatut = in_array($statut, [
                AutorisationStatutEnum::Validee->value,
                AutorisationStatutEnum::Refusee->value,
            ], true);

            $autorisation = Autorisation::create([
                'stagiaire_id' => $stagiaire->id,
                'target_user_id' => $formateur->id,
                'code' => $this->generateCode(),
                'motif' => $data['motif'] ?? null,
                'statut' => $statut,
                'date_validation' => $isDecisionStatut ? now() : null,
                'validated_by' => $isDecisionStatut ? $user->id : null,
                'created_by' => $user->id,
            ]);

            if ($absenceIds !== []) {
                Absence::whereKey($absenceIds)
                    ->whereNull('autorisation_id')
                    ->update(['autorisation_id' => $autorisation->id]);
            }

            $statutLabel = match ($statut) {
                AutorisationStatutEnum::Validee->value => 'acceptee',
                AutorisationStatutEnum::Refusee->value => 'refusee',
                default => 'en attente',
            };

            Notification::create([
                'user_id' => $formateur->id,
                'autorisation_id' => $autorisation->id,
                'title' => 'Nouvelle autorisation',
                'message' => sprintf(
                    'Une autorisation %s a ete creee pour %s %s.',
                    $statutLabel,
                    $stagiaire->prenom,
                    $stagiaire->nom,
                ),
                'type' => 'autorisation',
                'is_read' => false,
            ]);

            $autorisation->load([
                'absence.stagiaire.groupe.filiere',
                'absence.groupe.formateurs',
                'absences.stagiaire.groupe.filiere',
                'absences.groupe',
                'stagiaire.groupe.formateurs',
                'targetUser',
                'validatedByUser',
            ]);

            DB::commit();
        } catch (Throwable $exception) {
            DB::rollBack();

            throw $exception;
        }

        return response()->json([
            'success' => true,
            'message' => 'Autorisation creee',
            'data' => new AutorisationResource($autorisation),
        ], 201);
    }

    /**
     * Resolve the unique list of selected absence ids from validated data.
     *
     * @param  array<string, mixed>  $data
     * @return list<int>
     */
    private function resolveAbsenceIds(array $data): array
    {
        $rawIds = $data['absence_ids'] ?? (isset($data['absence_id']) ? [$data['absence_id']] : []);

        if (! is_array($rawIds)) {
            $rawIds = [$rawIds];
        }

        return array_values(array_unique(array_map(
            'intval',
            array_filter($rawIds, static fn ($id): bool => $id !== null && $id !== ''),
        )));
    }

    /**
     * Générer un code unique pour l'autorisation.
     */
    private function generateCode(): string
    {
        $code = '';
        $codeExists = true;

        while ($codeExists) {
            $code = sprintf(
                'AUT-%s-%s',
                now()->format('Ymd'),
                strtoupper(bin2hex(random_bytes(3))),
            );

            $codeExists = Autorisation::where('code', $code)->exists();
        }

        return $code;
    }
}
