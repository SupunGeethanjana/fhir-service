import { PartialType } from '@nestjs/swagger';
import { CreateAllergyIntoleranceDto } from './create-allergy-intolerance.dto';

export class UpdateAllergyIntoleranceDto extends PartialType(
  CreateAllergyIntoleranceDto
) {}
