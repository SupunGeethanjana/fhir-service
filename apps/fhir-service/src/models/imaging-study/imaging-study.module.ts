import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoreModule } from '../../core/core.module';
import { ImagingStudyHistory } from './entities/imaging-study-history.entity';
import { ImagingStudy } from './entities/imaging-study.entity';
import { ImagingStudyController } from './imaging-study.controller';
import { ImagingStudyService } from './imaging-study.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([ImagingStudy, ImagingStudyHistory]),
        forwardRef(() => CoreModule)
    ],
    controllers: [ImagingStudyController],
    providers: [ImagingStudyService],
    exports: [ImagingStudyService],
})
export class ImagingStudyModule { }
