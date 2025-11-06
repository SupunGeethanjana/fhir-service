import { PartialType } from '@nestjs/swagger';
import { CreateMedicationRequestDto } from './create-medication-request.dto';

export class UpdateMedicationRequestDto extends PartialType(
  CreateMedicationRequestDto
) {}
