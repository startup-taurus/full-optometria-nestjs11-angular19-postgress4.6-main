import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClinicalHistory } from '../clinical-histories/entities/clinical-history.entity';
import { LaboratoryOrder } from '../laboratory-orders/entities/laboratory-order.entity';
import { Patient } from '../patients/entities/patient.entity';
import { Campaign } from './entities/campaign.entity';
import { MessageDispatchLog } from './entities/message-dispatch-log.entity';
import { PatientContactPreference } from './entities/patient-contact-preference.entity';
import { ReminderRule } from './entities/reminder-rule.entity';
import { WhatsAppSession } from './entities/whatsapp-session.entity';
import { Shift } from '../shift-management/entities/shift.entity';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { WhatsAppWebJsProvider } from './providers/whatsapp-webjs.provider';
import { WHATSAPP_PROVIDER } from './providers/whatsapp-provider.interface';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WhatsAppSession,
      ReminderRule,
      Campaign,
      MessageDispatchLog,
      PatientContactPreference,
      Patient,
      ClinicalHistory,
      LaboratoryOrder,
      Shift,
    ]),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    WhatsAppWebJsProvider,
    {
      provide: WHATSAPP_PROVIDER,
      useExisting: WhatsAppWebJsProvider,
    },
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
