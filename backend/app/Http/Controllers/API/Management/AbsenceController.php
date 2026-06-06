<?php

declare(strict_types=1);

namespace App\Http\Controllers\API\Management;

use App\Http\Controllers\Controller;
use App\Http\Requests\Management\StoreAbsenceRequest;
use App\Http\Requests\Management\UpdateAbsenceRequest;
use App\Http\Resources\AbsenceResource;
use App\Models\Absence;
use App\Models\Notification;
use App\Models\Stagiaire;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Throwable;

class AbsenceController extends Controller
{
    /**
     * Liste des absences.
     */
    public function index(Request $request): JsonResponse
    {
        $user = auth()->user();

        $query = Absence::with([
            'stagiaire.groupe',
            'groupe.filiere',
            'autorisation.targetUser',
        ])->orderByDesc('date_absence')
            ->orderByDesc('created_at');

        if ($request->groupe_id) {
            $query->where('groupe_id', (int) $request->groupe_id);
        }

        if ($request->stagiaire_id) {
            $query->where('stagiaire_id', (int) $request->stagiaire_id);
        }

        if ($request->date_absence) {
            $query->whereDate('date_absence', (string) $request->date_absence);
        }

        if ($request->type) {
            $query->where('type', (string) $request->type);
        }

        $term = trim((string) $request->search);

        if ($term !== '') {
            $search = '%'.$term.'%';
            $terms = array_values(array_filter(preg_split('/\s+/', $term) ?: []));

            $query->where(function ($q) use ($search, $terms) {
                $q->whereHas('stagiaire', function ($stagiaireQuery) use ($search, $terms) {
                    $stagiaireQuery->where(function ($stagiaireSearchQuery) use ($search, $terms) {
                        $stagiaireSearchQuery->where('cef', 'like', $search)
                            ->orWhere('nom', 'like', $search)
                            ->orWhere('prenom', 'like', $search);

                        if (count($terms) > 1) {
                            $stagiaireSearchQuery->orWhere(function ($fullNameQuery) use ($terms) {
                                foreach ($terms as $term) {
                                    $like = '%'.$term.'%';

                                    $fullNameQuery->where(function ($namePartQuery) use ($like) {
                                        $namePartQuery->where('nom', 'like', $like)
                                            ->orWhere('prenom', 'like', $like);
                                    });
                                }
                            });
                        }
                    });
                })->orWhereHas('groupe', function ($groupeQuery) use ($search) {
                    $groupeQuery->where(function ($groupeSearchQuery) use ($search) {
                        $groupeSearchQuery->where('nom', 'like', $search)
                            ->orWhere('code', 'like', $search);
                    });
                });
            });
        }

        $absences = $query->paginate($this->perPage($request));

        return $this->paginatedResponse(
            AbsenceResource::collection($absences),
            'Liste des absences',
        );
    }

    /**
     * Détails d'une absence.
     */
    public function show(Request $request, int $absenceId): JsonResponse
    {
        $user = auth()->user();

        $absence = Absence::with([
            'stagiaire.groupe.filiere',
            'groupe.formateurs',
            'autorisation.targetUser',
            'autorisation.validatedByUser',
        ])->findOrFail($absenceId);

        return response()->json([
            'success' => true,
            'message' => 'Détails de l absence',
            'data' => new AbsenceResource($absence),
        ]);
    }

    /**
     * Créer une nouvelle absence.
     */
    public function store(StoreAbsenceRequest $request): JsonResponse
    {
        $user = auth()->user();

        $data = $request->validated();

        DB::beginTransaction();

        try {
            $stagiaire = Stagiaire::with('groupe.formateurs')
                ->findOrFail((int) $data['stagiaire_id']);

            $absence = Absence::create([
                'stagiaire_id' => $stagiaire->id,
                'groupe_id' => $stagiaire->groupe_id,
                'date_absence' => $data['date_absence'],
                'periode' => $data['periode'],
                'type' => $data['type'],
                'minutes_retard' => $data['minutes_retard'] ?? null,
                'remarque' => $data['remarque'] ?? null,
                'created_by' => $user->id,
            ]);

            $absence->load(['stagiaire', 'groupe.formateurs']);

            foreach ($absence->groupe->formateurs as $formateur) {
                Notification::create([
                    'user_id' => $formateur->id,
                    'absence_id' => $absence->id,
                    'title' => 'Nouvelle absence',
                    'message' => sprintf(
                        'Une %s a ete enregistree pour %s %s le %s.',
                        $absence->type->value,
                        $absence->stagiaire->prenom,
                        $absence->stagiaire->nom,
                        $absence->date_absence->toDateString(),
                    ),
                    'type' => 'absence',
                    'is_read' => false,
                ]);
            }

            $absence->load([
                'stagiaire.groupe.filiere',
                'groupe.formateurs',
                'autorisation.targetUser',
                'autorisation.validatedByUser',
            ]);

            DB::commit();
        } catch (Throwable $exception) {
            DB::rollBack();

            throw $exception;
        }

        return response()->json([
            'success' => true,
            'message' => 'Absence créée avec succès.',
            'data' => new AbsenceResource($absence),
        ], 201);
    }

    /**
     * Mettre a jour une absence.
     */
    public function update(UpdateAbsenceRequest $request, int $absenceId): JsonResponse
    {
        $user = auth()->user();

        $data = $request->validated();

        if (array_key_exists('stagiaire_id', $data)) {
            $stagiaire = Stagiaire::query()->findOrFail((int) $data['stagiaire_id']);
            $data['groupe_id'] = $stagiaire->groupe_id;
        }

        if (($data['type'] ?? null) === 'absence') {
            $data['minutes_retard'] = null;
        }

        $data['updated_by'] = $user->id;

        $absence = Absence::query()->findOrFail($absenceId);
        $absence->update($data);
        $absence->refresh();
        $absence->load([
            'stagiaire.groupe.filiere',
            'groupe.formateurs',
            'autorisation.targetUser',
            'autorisation.validatedByUser',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Absence mise a jour',
            'data' => new AbsenceResource($absence),
        ]);
    }
}
