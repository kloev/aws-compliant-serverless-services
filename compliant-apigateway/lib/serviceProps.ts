import {
    aws_apigateway as apigw
} from 'aws-cdk-lib';
import { CompliantApigatewayProps } from '.';


//Compliant config rules
// const RULE = 'RULE';
const API_GW_ASSOCIATED_WITH_WAF = 'API_GW_ASSOCIATED_WITH_WAF';
const API_GW_CACHE_ENABLED_AND_ENCRYPTED = 'API_GW_CACHE_ENABLED_AND_ENCRYPTED';
const API_GW_ENDPOINT_TYPE_CHECK = 'API_GW_ENDPOINT_TYPE_CHECK';
const API_GW_EXECUTION_LOGGING_ENABLED = 'API_GW_EXECUTION_LOGGING_ENABLED';

// function getHasWaf(props: CompliantApigatewayProps) {
//     if (props. != undefined){
//         return props.xx
//     }

//     if (
//         props.disabledRules?.includes(RULE)
//     ){
//         return apigw default einstellung
//     }
//  oder 
//     return !props.disabledRules?.includes(RULE);
// }

// function getEndpointType(props: CompliantApigatewayProps) {

// }

function getLoggingEnabled(props: CompliantApigatewayProps) {
    /**
 * Enable tracing and logging in JSON format for the API.
 */
        //  tracingEnabled: true,
        return apigw.AccessLogField
        // accessLogDestination: new LogGroupLogDestination(new LogGroup(this, 'AccessLog', {
        //     retention: RetentionDays.ONE_MONTH,
        //     removalPolicy: RemovalPolicy.DESTROY,
        // })),
        //     accessLogFormat: AccessLogFormat.custom(JSON.stringify({
        //         requestTime: AccessLogField.contextRequestTime(),
        //         requestTimeEpoch: AccessLogField.contextRequestTimeEpoch(),
        //         requestId: AccessLogField.contextRequestId(),
        //         extendedRequestId: AccessLogField.contextExtendedRequestId(),
        //         sourceIp: AccessLogField.contextIdentitySourceIp(),
        //         method: AccessLogField.contextHttpMethod(),
        //         resourcePath: AccessLogField.contextResourcePath(),
        //         traceId: AccessLogField.contextXrayTraceId(),
        //     })),
}

export {  getLoggingEnabled };