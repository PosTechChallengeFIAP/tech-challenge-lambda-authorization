import { APIGatewayAuthorizerResultContext, APIGatewayTokenAuthorizerEvent } from "aws-lambda";
import * as jwt from "jsonwebtoken";

export class AuthorizationLambda {
    static async handler(event: APIGatewayTokenAuthorizerEvent): Promise<APIGatewayAuthorizerResultContext> {
        async function validateToken(token: string): Promise<boolean> {
            try {
                const decodedToken = jwt.decode(token, { complete: true });
                if (!decodedToken || !decodedToken.header || !decodedToken.header.kid || typeof decodedToken.payload === "string") {
                    throw new Error("Invalid format token");
                }
                
                const issuer = decodedToken.payload.iss;
                console.log("Issuer:", issuer);
                if (!issuer) {
                    throw new Error("Issuer not found in token");
                }

                const response = await fetch(`${issuer}/.well-known/jwks.json`);
                const { keys } = await response.json();
            
                const key = keys.find((k: any) => k.kid === decodedToken.header.kid);
                if (!key) {
                    throw new Error("Key not found");
                }
            
                const publicKey = `-----BEGIN CERTIFICATE-----\n${key.x5c[0]}\n-----END CERTIFICATE-----`;
            
                jwt.verify(token, publicKey, { algorithms: ["RS256"], issuer: issuer });
            
                return true;
            } catch (error) {
                console.error("Token validation error:", error);
                return false;
            }
        }

        const token = event.authorizationToken?.replace("Bearer ", "");

        if (!token) {
            throw new Error("Unauthorized: No token provided");
        }

        const isValid = await validateToken(token);
        if (!isValid) {
            throw new Error("Unauthorized: Invalid token");
        }

        return {
            isAuthorized: true,
        };
    }
}