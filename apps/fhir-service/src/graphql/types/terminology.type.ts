import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class CodeSystemConcept {
    @Field()
    code: string;

    @Field()
    display: string;

    @Field({ nullable: true })
    definition?: string;
}

@ObjectType()
export class CodeSystem {
    @Field(() => ID)
    id: string;

    @Field()
    url: string;

    @Field()
    name: string;

    @Field()
    title: string;

    @Field()
    status: string;

    @Field()
    version: string;

    @Field()
    date: string;

    @Field()
    publisher: string;

    @Field()
    description: string;

    @Field(() => Int)
    count: number;

    @Field(() => [CodeSystemConcept])
    concept: CodeSystemConcept[];
}

@ObjectType()
export class ValueSetConcept {
    @Field()
    code: string;

    @Field()
    display: string;

    @Field({ nullable: true })
    system?: string;
}

@ObjectType()
export class ValueSetCompose {
    @Field(() => [ValueSetInclude])
    include: ValueSetInclude[];
}

@ObjectType()
export class ValueSetInclude {
    @Field()
    system: string;

    @Field(() => [ValueSetConcept], { nullable: true })
    concept?: ValueSetConcept[];
}

@ObjectType()
export class ValueSet {
    @Field(() => ID)
    id: string;

    @Field()
    url: string;

    @Field()
    name: string;

    @Field()
    title: string;

    @Field()
    status: string;

    @Field()
    version: string;

    @Field()
    date: string;

    @Field()
    publisher: string;

    @Field()
    description: string;

    @Field()
    purpose: string;

    @Field(() => ValueSetCompose)
    compose: ValueSetCompose;
}

@ObjectType()
export class TerminologySearchResult {
    @Field(() => [CodeSystem], { nullable: true })
    codeSystems?: CodeSystem[];

    @Field(() => [ValueSet], { nullable: true })
    valueSets?: ValueSet[];

    @Field(() => Int)
    total: number;
}

@ObjectType()
export class ConceptLookupResult {
    @Field()
    code: string;

    @Field()
    display: string;

    @Field({ nullable: true })
    definition?: string;

    @Field()
    system: string;

    @Field()
    found: boolean;
}

@ObjectType()
export class CodeValidationResult {
    @Field()
    result: boolean;

    @Field({ nullable: true })
    message?: string;

    @Field({ nullable: true })
    display?: string;

    @Field({ nullable: true })
    code?: string;

    @Field({ nullable: true })
    system?: string;
}

@ObjectType()
export class ExpandedValueSet {
    @Field()
    url: string;

    @Field()
    version: string;

    @Field(() => [ValueSetConcept])
    contains: ValueSetConcept[];

    @Field(() => Int)
    total: number;

    @Field(() => Int)
    offset: number;

    @Field(() => Int, { nullable: true })
    count?: number;
}

@ObjectType()
export class DropdownOption {
    @Field()
    value: string;

    @Field()
    label: string;

    @Field({ nullable: true })
    description?: string;

    @Field({ nullable: true })
    system?: string;
}

@ObjectType()
export class ValueSetDropdownResult {
    @Field(() => [DropdownOption])
    options: DropdownOption[];

    @Field()
    valueSetId: string;

    @Field()
    valueSetTitle: string;

    @Field(() => Int)
    total: number;
}
