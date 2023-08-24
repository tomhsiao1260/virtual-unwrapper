#define PI 3.1415926535897932384626433832795

uniform float uTime;
uniform float uScEnd;
uniform vec3 uColorEnd;
uniform sampler2D uTexture;

varying vec2 vUv;

void main()
{
    vec4 texture = texture2D(uTexture, vUv);
    float intensity = texture.r;

    vec3 color = intensity * uScEnd * uColorEnd;

    gl_FragColor = vec4(color, texture.a);
    // gl_FragColor = texture;
}
