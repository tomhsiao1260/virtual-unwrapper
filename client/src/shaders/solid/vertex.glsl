#define PI 3.1415926535897932384626433832795

uniform float uFlatten;
uniform bool uFlip;
uniform float uTime;
uniform float uArea;
uniform vec3 uCenter;
uniform vec3 uNormal;
uniform vec2 uTifsize;
uniform vec3 uBasevectorX;
uniform vec3 uBasevectorY;

varying vec2 vUv;

void main()
{
    float flip = uFlip ? -1.0 : 1.0;
    float r = uTifsize.y / uTifsize.x;

    vec3 dir = (0.5 - uv.x) * uBasevectorX + (0.5 - uv.y) * uBasevectorY * r * flip;
    vec3 flatten = uCenter + dir * sqrt(uArea / r);

    vec3 newPosition = position + (flatten - position) * uFlatten;

    vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;

    gl_Position = projectedPosition;

    vUv = uv;
}
