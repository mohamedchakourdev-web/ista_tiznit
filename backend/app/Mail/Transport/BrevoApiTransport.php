<?php

declare(strict_types=1);

namespace App\Mail\Transport;

use Illuminate\Support\Facades\Http;
use SensitiveParameter;
use Symfony\Component\Mailer\Envelope;
use Symfony\Component\Mailer\Exception\TransportException;
use Symfony\Component\Mailer\SentMessage;
use Symfony\Component\Mailer\Transport\AbstractTransport;
use Symfony\Component\Mime\Address;
use Symfony\Component\Mime\Email;
use Symfony\Component\Mime\MessageConverter;
use Throwable;

/**
 * Sends email through the Brevo REST API (HTTPS), for environments where SMTP is blocked.
 */
class BrevoApiTransport extends AbstractTransport
{
    public function __construct(
        #[SensitiveParameter] protected string $apiKey,
        protected string $endpoint = 'https://api.brevo.com/v3/smtp/email',
    ) {
        parent::__construct();
    }

    protected function doSend(SentMessage $message): void
    {
        if ($this->apiKey === '') {
            throw new TransportException('Brevo API key is not configured.');
        }

        try {
            $response = Http::withHeaders([
                'api-key' => $this->apiKey,
                'Accept' => 'application/json',
            ])
                ->timeout(30)
                ->post($this->endpoint, $this->getPayload($message));
        } catch (Throwable $exception) {
            throw new TransportException(
                sprintf('Request to Brevo API failed. Reason: %s.', $exception->getMessage()),
                is_int($exception->getCode()) ? $exception->getCode() : 0,
                $exception,
            );
        }

        if ($response->failed()) {
            throw new TransportException(
                sprintf('Brevo API returned HTTP %d. Response: %s', $response->status(), $response->body()),
                $response->status(),
            );
        }
    }

    /**
     * @return array<string, mixed>
     */
    protected function getPayload(SentMessage $message): array
    {
        $email = MessageConverter::toEmail($message->getOriginalMessage());
        $envelope = $message->getEnvelope();

        $payload = [
            'sender' => $this->formatAddress($envelope->getSender()),
            'to' => $this->formatAddresses($this->getRecipients($email, $envelope)),
            'subject' => (string) $email->getSubject(),
        ];

        $htmlBody = $email->getHtmlBody();
        $textBody = $email->getTextBody();

        if (is_string($htmlBody) && $htmlBody !== '') {
            $payload['htmlContent'] = $htmlBody;
        }

        if (is_string($textBody) && $textBody !== '') {
            $payload['textContent'] = $textBody;
        }

        if ($email->getCc() !== []) {
            $payload['cc'] = $this->formatAddresses($email->getCc());
        }

        if ($email->getBcc() !== []) {
            $payload['bcc'] = $this->formatAddresses($email->getBcc());
        }

        $replyTo = $email->getReplyTo();

        if ($replyTo !== []) {
            $payload['replyTo'] = $this->formatAddress($replyTo[0]);
        }

        $attachments = $this->getAttachments($email);

        if ($attachments !== []) {
            $payload['attachment'] = $attachments;
        }

        return $payload;
    }

    /**
     * @return list<Address>
     */
    protected function getRecipients(Email $email, Envelope $envelope): array
    {
        return array_values(array_filter(
            $envelope->getRecipients(),
            static fn (Address $address): bool => ! in_array(
                $address,
                array_merge($email->getCc(), $email->getBcc()),
                true,
            ),
        ));
    }

    /**
     * @param  list<Address>  $addresses
     * @return list<array{email: string, name?: string}>
     */
    protected function formatAddresses(array $addresses): array
    {
        return array_map(
            fn (Address $address): array => $this->formatAddress($address),
            $addresses,
        );
    }

    /**
     * @return array{email: string, name?: string}
     */
    protected function formatAddress(Address $address): array
    {
        $formatted = [
            'email' => $address->getAddress(),
        ];

        $name = $address->getName();

        if (is_string($name) && $name !== '') {
            $formatted['name'] = $name;
        }

        return $formatted;
    }

    /**
     * @return list<array{content: string, name: string}>
     */
    protected function getAttachments(Email $email): array
    {
        $attachments = [];

        foreach ($email->getAttachments() as $attachment) {
            $headers = $attachment->getPreparedHeaders();

            $attachments[] = [
                'content' => base64_encode($attachment->getBody()),
                'name' => (string) $headers->getHeaderParameter('Content-Disposition', 'filename'),
            ];
        }

        return $attachments;
    }

    public function __toString(): string
    {
        return 'brevo';
    }
}
