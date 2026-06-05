<?php

declare(strict_types=1);

namespace Tests\Unit\Mail;

use App\Mail\Transport\BrevoApiTransport;
use Illuminate\Support\Facades\Http;
use Symfony\Component\Mailer\Envelope;
use Symfony\Component\Mailer\SentMessage;
use Symfony\Component\Mime\Address;
use Symfony\Component\Mime\Email;
use Tests\TestCase;

class BrevoApiTransportTest extends TestCase
{
    public function test_it_posts_rendered_email_to_brevo_api(): void
    {
        Http::fake([
            'https://api.brevo.com/v3/smtp/email' => Http::response(['messageId' => '<test@brevo>'], 201),
        ]);

        $transport = new BrevoApiTransport('test-api-key');

        $email = (new Email)
            ->from(new Address('noreply@example.test', 'OFPPT'))
            ->to(new Address('user@example.test', 'User'))
            ->subject('Test subject')
            ->html('<p>Hello</p>')
            ->text('Hello');

        $envelope = new Envelope(
            new Address('noreply@example.test', 'OFPPT'),
            [new Address('user@example.test', 'User')],
        );

        $transport->send($email, $envelope);

        Http::assertSent(function ($request): bool {
            $body = $request->data();

            return $request->url() === 'https://api.brevo.com/v3/smtp/email'
                && $request->hasHeader('api-key', 'test-api-key')
                && ($body['sender']['email'] ?? null) === 'noreply@example.test'
                && ($body['to'][0]['email'] ?? null) === 'user@example.test'
                && ($body['subject'] ?? null) === 'Test subject'
                && ($body['htmlContent'] ?? null) === '<p>Hello</p>'
                && ($body['textContent'] ?? null) === 'Hello';
        });
    }
}
