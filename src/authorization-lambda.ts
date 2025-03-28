import { APIGatewayAuthorizerResultContext, APIGatewayRequestAuthorizerEvent } from "aws-lambda";
import * as jwt from "jsonwebtoken";
import * as jwkToPem from "jwk-to-pem";

export class AuthorizationLambda {
    static async handler(event: APIGatewayRequestAuthorizerEvent): Promise<APIGatewayAuthorizerResultContext> {
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
                console.log("JWKS response:", response.status);
                const { keys } = await response.json();
                console.log("Keys:", keys);
                const key = keys.find((k: any) => k.kid === decodedToken.header.kid);
                if (!key) {
                    throw new Error("Key not found");
                }
                console.log("Encontrou a Key:", key);
            
                const publicKey = jwkToPem(key);
            
                console.log("Teste", token, publicKey, issuer);
                jwt.verify(token, publicKey, { algorithms: ["RS256"], issuer: issuer });
            
                return true;
            } catch (error) {
                console.error("Token validation error:", error);
                return false;
            }
        }

        try {
            console.log("Event:", event);
            const token = event.headers?.authorization?.replace("Bearer ", "");
            console.log("Token:", token);
    
            if (!token) {
                throw new Error("Unauthorized: No token provided");
            }
    
            const isValid = await validateToken(token);
            if (!isValid) {
                throw new Error("Unauthorized: Invalid token");
            }
        } catch (error: any) {
           return {
                isAuthorized: false,
                errorMessage: error?.message || 'Unauthorized',
           }
        }

        return {
            isAuthorized: true,
        };
    }
}