import { PartialType } from '@nestjs/swagger';
import { CreateImagingStudyDto } from './create-imaging-study.dto';

export class UpdateImagingStudyDto extends PartialType(CreateImagingStudyDto) { }
