#define PI 3.1415926535897932384626433832795

uniform float uFlatten;
uniform bool uFlip;
uniform float uTime;
uniform float uSize;
uniform float uArea;
uniform vec3 uCenter;
uniform vec3 uNormal;
uniform vec2 uTifsize;
uniform vec3 uBasevectorX;
uniform vec3 uBasevectorY;

varying vec2 vUv;

vec3 rotateVector(vec3 v, vec3 axis, float theta) {
    float cosTheta = cos(theta);
    float sinTheta = sin(theta);
    float oneMinusCosTheta = 1.0 - cosTheta;

    mat3 rotationMatrix = mat3(
        cosTheta + axis.x * axis.x * oneMinusCosTheta,        axis.x * axis.y * oneMinusCosTheta - axis.z * sinTheta, axis.x * axis.z * oneMinusCosTheta + axis.y * sinTheta,
        axis.y * axis.x * oneMinusCosTheta + axis.z * sinTheta, cosTheta + axis.y * axis.y * oneMinusCosTheta,        axis.y * axis.z * oneMinusCosTheta - axis.x * sinTheta,
        axis.z * axis.x * oneMinusCosTheta - axis.y * sinTheta, axis.z * axis.y * oneMinusCosTheta + axis.x * sinTheta, cosTheta + axis.z * axis.z * oneMinusCosTheta
    );

    return rotationMatrix * v;
}

void main()
{
    float flip = uFlip ? -1.0 : 1.0;
    float scroll = 3.0;
    float r = uTifsize.y / uTifsize.x;

    float theta = -uFlatten * uv.y * 2.0 * PI * scroll;
    vec3 uBasevectorY_ = rotateVector(uBasevectorY, normalize(uBasevectorX), theta);

    vec3 dir = (0.5 - uv.x) * uBasevectorX + (0.5 - uv.y) * uBasevectorY * r * flip;
    // vec3 dir = (uv.x - 0.5) * uBasevectorX + (uv.y - 0.0) * uBasevectorY_ * r * flip;
    vec3 flatten = uCenter + dir * sqrt(uArea / r);

    vec3 newPosition = position + (flatten - position) * uFlatten;

    vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;

    gl_Position = projectedPosition;

    gl_PointSize = uSize;
    gl_PointSize *= (1.0 / - viewPosition.z);

    vUv = uv;
}
