#define PI 3.1415926535897932384626433832795

uniform float uTime;
uniform sampler2D uTexture;

varying vec2 vUv;

void main()
{
    vec3 color = vec3(vUv, 1.0);

    gl_FragColor  = texture2D(uTexture, gl_PointCoord);
    gl_FragColor *= vec4(color, 1.0);
}
