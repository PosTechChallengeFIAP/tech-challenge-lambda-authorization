import { Context, SQSEvent } from "aws-lambda";

export class OrderLambda {
    static async handler(event: SQSEvent, context: Context) {
        const record = event.Records[0];
        const body = JSON.parse(record.body);
        console.log('OrderLambda.handler', event);
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'OrderLambda.handler executed successfully!',
                input: body,
            }),
        };
    }
}