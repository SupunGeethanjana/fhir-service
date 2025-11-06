import { PartialType } from '@nestjs/swagger';
import { CreateFamilyMemberHistoryDto } from './create-family-member-history.dto';

export class UpdateFamilyMemberHistoryDto extends PartialType(
  CreateFamilyMemberHistoryDto
) {}
