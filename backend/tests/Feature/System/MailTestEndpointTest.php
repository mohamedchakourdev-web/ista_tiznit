<?php

declare(strict_types=1);

namespace Tests\Feature\System;

use Tests\TestCase;

class MailTestEndpointTest extends TestCase
{
    public function test_mail_test_endpoint_requires_token(): void
    {
        config(['services.brevo.mail_test_token' => 'secret-token']);

        $this->postJson('/api/system/mail/test', [
            'email' => 'test@example.test',
        ])
            ->assertUnauthorized()
            ->assertJsonPath('success', false);
    }

    public function test_mail_test_endpoint_validates_email(): void
    {
        config(['services.brevo.mail_test_token' => 'secret-token']);

        $this->postJson('/api/system/mail/test', [
            'email' => 'not-an-email',
        ], [
            'X-Mail-Test-Token' => 'secret-token',
        ])
            ->assertUnprocessable();
    }
}
