import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoreModule } from '../../core/core.module';
import { PractitionerHistory } from './entities/practitioner-history.entity';
import { Practitioner } from './entities/practitioner.entity';
import { PractitionerController } from './practitioner.controller';
import { PractitionerService } from './practitioner.service';

@Module({
    imports: [TypeOrmModule.forFeature([Practitioner, PractitionerHistory]), forwardRef(() => CoreModule)],
    controllers: [PractitionerController],
    providers: [PractitionerService],
    exports: [PractitionerService],
})
export class PractitionerModule { }
