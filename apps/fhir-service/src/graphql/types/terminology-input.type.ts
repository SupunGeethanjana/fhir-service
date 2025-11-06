import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class CodeSystemSearchInput {
    @Field({ nullable: true })
    url?: string;

    @Field({ nullable: true })
    name?: string;

    @Field({ nullable: true })
    title?: string;

    @Field({ nullable: true })
    status?: string;

    @Field({ nullable: true })
    version?: string;

    @Field(() => Int, { nullable: true, defaultValue: 50 })
    count?: number;

    @Field(() => Int, { nullable: true, defaultValue: 0 })
    offset?: number;
}

@InputType()
export class ValueSetSearchInput {
    @Field({ nullable: true })
    url?: string;

    @Field({ nullable: true })
    name?: string;

    @Field({ nullable: true })
    title?: string;

    @Field({ nullable: true })
    status?: string;

    @Field(() => Int, { nullable: true, defaultValue: 50 })
    count?: number;

    @Field(() => Int, { nullable: true, defaultValue: 0 })
    offset?: number;
}

@InputType()
export class ConceptLookupInput {
    @Field()
    system: string;

    @Field()
    code: string;

    @Field({ nullable: true })
    version?: string;
}

@InputType()
export class ValueSetExpandInput {
    @Field()
    url: string;

    @Field(() => Int, { nullable: true, defaultValue: 100 })
    count?: number;

    @Field(() => Int, { nullable: true, defaultValue: 0 })
    offset?: number;

    @Field({ nullable: true })
    filter?: string;
}

@InputType()
export class CodeValidationInput {
    @Field()
    url: string;

    @Field()
    code: string;

    @Field({ nullable: true })
    system?: string;

    @Field({ nullable: true })
    display?: string;
}

@InputType()
export class TerminologySearchInput {
    @Field({ nullable: true })
    text?: string;

    @Field({ nullable: true })
    code?: string;

    @Field({ nullable: true })
    system?: string;

    @Field({ nullable: true })
    category?: string; // allergies, medications, procedures, etc.

    @Field(() => Int, { nullable: true, defaultValue: 50 })
    count?: number;

    @Field(() => Int, { nullable: true, defaultValue: 0 })
    offset?: number;
}

@InputType()
export class ValueSetDropdownInput {
    @Field({ nullable: true })
    name?: string;

    @Field({ nullable: true })
    url?: string;

    @Field({ nullable: true })
    filter?: string;

    @Field(() => Int, { nullable: true, defaultValue: 100 })
    limit?: number;

    @Field({ nullable: true })
    sortBy?: string; // 'display', 'code'

    @Field({ nullable: true, defaultValue: 'asc' })
    sortOrder?: string; // 'asc', 'desc'
}
