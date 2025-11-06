import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GenericFhirController } from '../../fhir-generics/generic-fhir.controller';
import { DocumentReferenceService } from './document-reference.service';
import { DocumentReferenceHistory } from './entities/document-reference-history.entity';
import { DocumentReference } from './entities/document-reference.entity';

@ApiTags('DocumentReference')
@Controller('DocumentReference')
export class DocumentReferenceController extends GenericFhirController<DocumentReference, DocumentReferenceHistory> {
    constructor(private readonly documentReferenceService: DocumentReferenceService) {
        super(documentReferenceService);
    }
}
