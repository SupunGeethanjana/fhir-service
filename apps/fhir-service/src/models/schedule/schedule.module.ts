import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoreModule } from '../../core/core.module';
import { ScheduleHistory } from './entities/schedule-history.entity';
import { Schedule } from './entities/schedule.entity';
import { ScheduleController } from './schedule.controller';
import { ScheduleService } from './schedule.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Schedule, ScheduleHistory]), forwardRef(() => CoreModule),
        forwardRef(() => CoreModule),
    ],
    controllers: [ScheduleController],
    providers: [ScheduleService],
    exports: [ScheduleService],
})
export class ScheduleModule { }
