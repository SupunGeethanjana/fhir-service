import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoreModule } from '../../core/core.module';
import { DocumentReferenceController } from './document-reference.controller';
import { DocumentReferenceService } from './document-reference.service';
import { DocumentReferenceHistory } from './entities/document-reference-history.entity';
import { DocumentReference } from './entities/document-reference.entity';

@Module({
    imports: [TypeOrmModule.forFeature([DocumentReference, DocumentReferenceHistory]), forwardRef(() => CoreModule)],
    controllers: [DocumentReferenceController],
    providers: [DocumentReferenceService],
    exports: [DocumentReferenceService],
})
export class DocumentReferenceModule { }
