#define PI 3.1415926535897932384626433832795

uniform float uFlatten;
uniform float uTime;
uniform float uSize;
uniform float uArea;
uniform vec3 uCenter;
uniform vec3 uNormal;
uniform vec2 uTifsize;
uniform vec3 uEigenvectorX;
uniform vec3 uEigenvectorY;

varying vec2 vUv;

void main()
{
    float ratio = uTifsize.y / uTifsize.x;
    vec3 dir = (uv.x - 0.5) * 1.0 * uEigenvectorX + (uv.y - 0.5) * ratio * uEigenvectorY;
    vec3 flatten = uCenter + dir * sqrt(uArea / ratio);

    vec3 newPosition = position + (flatten - position) * uFlatten;

    vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);  
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;

    gl_Position = projectedPosition;

    gl_PointSize = uSize;
    gl_PointSize *= (1.0 / - viewPosition.z);

    vUv = uv;
}
