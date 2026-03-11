import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { createKafkaConfig } from '../config/kafka.config';
import { AuthorizationEvents, ZorbitEventEnvelope } from './navigation.events';

/**
 * Consumes authorization domain events from Kafka.
 * Reacts to role/privilege changes that may affect navigation visibility.
 */
@Injectable()
export class EventConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventConsumerService.name);
  private consumer!: Consumer;
  private kafka!: Kafka;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const kafkaConfig = createKafkaConfig(this.configService);
    this.kafka = new Kafka({
      clientId: kafkaConfig.clientId,
      brokers: kafkaConfig.brokers,
    });
    this.consumer = this.kafka.consumer({ groupId: kafkaConfig.groupId });

    try {
      await this.consumer.connect();
      this.logger.log('Kafka consumer connected');

      // Subscribe to authorization events
      const topics = [
        AuthorizationEvents.ROLE_CREATED.replace(/\./g, '-'),
        AuthorizationEvents.ROLE_UPDATED.replace(/\./g, '-'),
        AuthorizationEvents.PRIVILEGE_ASSIGNED.replace(/\./g, '-'),
      ];

      for (const topic of topics) {
        await this.consumer.subscribe({ topic, fromBeginning: false });
      }

      await this.consumer.run({
        eachMessage: async (messagePayload: EachMessagePayload) => {
          await this.handleMessage(messagePayload);
        },
      });

      this.logger.log('Subscribed to authorization event topics');
    } catch (error) {
      this.logger.warn('Kafka consumer connection failed — events will not be consumed', error);
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.consumer?.disconnect();
    } catch {
      // swallow on shutdown
    }
  }

  private async handleMessage({ topic, message }: EachMessagePayload): Promise<void> {
    try {
      const value = message.value?.toString();
      if (!value) return;

      const envelope: ZorbitEventEnvelope = JSON.parse(value);
      this.logger.debug(`Received event ${envelope.eventType} from topic ${topic}`);

      // TODO: Implement handlers for authorization events
      // e.g. invalidate cached navigation trees when privileges change
      switch (envelope.eventType) {
        case AuthorizationEvents.ROLE_CREATED:
          this.logger.log(`Role created: ${JSON.stringify(envelope.payload)}`);
          break;
        case AuthorizationEvents.ROLE_UPDATED:
          this.logger.log(`Role updated: ${JSON.stringify(envelope.payload)}`);
          break;
        case AuthorizationEvents.PRIVILEGE_ASSIGNED:
          this.logger.log(`Privilege assigned: ${JSON.stringify(envelope.payload)}`);
          break;
        default:
          this.logger.warn(`Unknown event type: ${envelope.eventType}`);
      }
    } catch (error) {
      this.logger.error(`Error processing message from topic ${topic}`, error);
    }
  }
}
