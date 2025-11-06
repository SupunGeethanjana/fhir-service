import { Field, ObjectType } from '@nestjs/graphql';
import { GraphQLJSONObject } from 'graphql-type-json';

@ObjectType()
export class FhirBundleResponseEntry {
    @Field(() => GraphQLJSONObject, { nullable: true })
    response?: any;

    @Field(() => GraphQLJSONObject, { nullable: true })
    resource?: any;
}
