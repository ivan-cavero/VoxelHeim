import { api, APIError } from 'encore.dev/api'
import { Subscription } from 'encore.dev/pubsub'
import { UserEmailTopic, type EmailEvent } from '../auth/auth'
import log from 'encore.dev/log'

// API endpoint to send an email
export const sendEmail = api(
	{
		expose: false,
		method: 'POST'
	},
	async ({ to, subject, template, data }: EmailEvent): Promise<void> => {
		try {
			// Here you would integrate with your email service (SendGrid, etc)
			log.info('Sending email', {
				to,
				subject,
				template,
				data
			})

			// Simulate sending an email
			await new Promise((resolve) => setTimeout(resolve, 100))

			log.info('Email sent successfully', { to })
		} catch (_error) {
			throw APIError.internal('Failed to send email')
		}
	}
)

// Subscribe to the UserEmailTopic
new Subscription(UserEmailTopic, 'send-user-email', {
	handler: async (event: EmailEvent) => {
		const templates = {
			verification: {
				subject: 'Verify your email',
				body: `Click this link to verify your email: ${process.env.APP_URL}/verify-email?token=${event.data.token}`
			},
			password_reset: {
				subject: 'Reset your password',
				body: `Click this link to reset your password: ${process.env.APP_URL}/reset-password?token=${event.data.token}`
			}
		}

		const template = templates[event.template]

		await sendEmail({
			to: event.to,
			subject: template.subject,
			template: event.template,
			data: event.data
		})
	}
})
