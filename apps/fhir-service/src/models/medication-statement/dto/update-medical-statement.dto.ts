import { PartialType } from '@nestjs/swagger';
import { CreateMedicalStatementDto } from './create-medical-statement.dto';

export class UpdateMedicalStatementDto extends PartialType(
  CreateMedicalStatementDto
) {}
