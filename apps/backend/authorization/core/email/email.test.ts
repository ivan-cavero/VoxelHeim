import { describe, it, expect, vi } from 'vitest'
import { sendEmail } from './email'
import { UserEmailTopic, type EmailEvent } from '../auth/auth'
import { Subscription, type Topic, type SubscriptionConfig } from 'encore.dev/pubsub'
import log from 'encore.dev/log'

vi.mock('encore.dev/log', () => ({
	default: {
		info: vi.fn()
	}
}))

vi.mock('encore.dev/pubsub', () => ({
	Subscription: vi.fn()
}))

describe('Email Service', () => {
	it('should send an email', async () => {
		const emailEvent: EmailEvent = {
			to: 'test@example.com',
			subject: 'Test Email',
			template: 'verification',
			data: {
				token: 'test_token',
				username: 'testuser'
			}
		}

		await sendEmail(emailEvent)
		expect(log.info).toHaveBeenCalledWith('Sending email', expect.any(Object))
		expect(log.info).toHaveBeenCalledWith('Email sent successfully', { to: 'test@example.com' })
	})

	it('should handle UserEmailTopic subscription', async () => {
		const mockHandler = vi.fn()

		vi.mocked(Subscription).mockImplementation((_topic: Topic<object>, _name: string, cfg: SubscriptionConfig<object>) => {
			// Simulate calling the handler
			cfg.handler(mockHandler as unknown as object)
			return {} as Subscription<object>
		})

		const emailEvent: EmailEvent = {
			to: 'test@example.com',
			subject: 'Verify your email',
			template: 'verification',
			data: {
				token: 'test_token',
				username: 'testuser'
			}
		}

		new Subscription(UserEmailTopic, 'test-subscription', {
			handler: async (event: EmailEvent) => {
				await mockHandler(event)
			}
		} as SubscriptionConfig<object>)

		expect(mockHandler).toHaveBeenCalledWith(emailEvent)
	})
})
