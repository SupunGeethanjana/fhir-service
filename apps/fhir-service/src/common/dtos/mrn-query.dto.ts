import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

/**
 * DTO for MRN listing query parameters
 */
export class MrnQueryDto {
    /**
     * Number of MRNs to return (default: 100, max: 1000)
     */
    @ApiPropertyOptional({
        description: 'Number of MRNs to return per page',
        minimum: 1,
        maximum: 1000,
        default: 100,
        example: 100,
        type: Number
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    @Max(1000)
    limit?: number = 100;

    /**
     * Offset for pagination (default: 0)
     */
    @ApiPropertyOptional({
        description: 'Number of results to skip for pagination',
        minimum: 0,
        default: 0,
        example: 0,
        type: Number
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    offset?: number = 0;

    /**
     * Search term for partial MRN matching
     */
    @ApiPropertyOptional({
        description: 'Search term for partial MRN matching',
        example: '123',
        type: String
    })
    @IsOptional()
    @IsString()
    search?: string;

    /**
     * Filter by identifier system
     */
    @ApiPropertyOptional({
        description: 'Filter MRNs by identifier system',
        example: 'http://hospital.org/mrn',
        type: String
    })
    @IsOptional()
    @IsString()
    system?: string;

    /**
     * Filter by patient active status
     */
    @ApiPropertyOptional({
        description: 'Filter by patient active status',
        example: true,
        type: Boolean
    })
    @IsOptional()
    @Transform(({ value }) => {
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value;
    })
    @IsBoolean()
    active?: boolean;
}
