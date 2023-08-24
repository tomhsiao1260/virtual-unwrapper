import * as THREE from 'three'
import GUI from 'lil-gui'
import data from './segment.json'

import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { ArcballControls } from 'three/addons/controls/ArcballControls.js';

import maskFragmentShader from './shaders/mask/fragment.glsl'
import solidVertexShader from './shaders/solid/vertex.glsl'
import solidFragmentShader from './shaders/solid/fragment.glsl'
import particlesVertexShader from './shaders/particles/vertex.glsl'
import particlesFragmentShader from './shaders/particles/fragment.glsl'

const canvas = document.querySelector('canvas.webgl')
const scene = new THREE.Scene()

const center = new THREE.Vector3().fromArray(data.center)
const tifsize = new THREE.Vector2().fromArray(data.tifsize)
const normal = new THREE.Vector3().fromArray(data.normal).normalize()
const boundingbox = new THREE.Vector3().fromArray(data.boundingbox)
const basevectorX = new THREE.Vector3().fromArray(data.basevectors[0]).normalize()
const basevectorY = new THREE.Vector3().fromArray(data.basevectors[1]).normalize()

const parameters = {
    flatten: 0,
    point: false,
    point_size: 5.0,
    flip: true,
    adjust: 0.2,
    alpha: 0.9,
    end: {
        sc: 0.88,
        r: 0.93,
        g: 0.80,
        b: 0.70,
    }
}

const gui = new GUI()
gui.add(parameters, 'flatten').min(0).max(1).step(0.01).onChange(updateUniforms)
gui.add(parameters, 'point').onChange(updateUniforms)
gui.add(parameters, 'point_size').min(0).max(30).step(0.01).onChange(updateUniforms)
gui.add(parameters, 'flip').onChange(updateUniforms)
gui.add(parameters, 'adjust').min(0).max(1).step(0.01).onChange(updateUniforms)
gui.add(parameters, 'alpha').min(0).max(1).step(0.01).onChange(updateUniforms)
gui.add(parameters.end, 'sc').min(0.0).max(1.5).step(0.01).onChange(updateUniforms)
gui.add(parameters.end, 'r').min(0).max(1).step(0.01).onChange(updateUniforms)
gui.add(parameters.end, 'g').min(0).max(1).step(0.01).onChange(updateUniforms)
gui.add(parameters.end, 'b').min(0).max(1).step(0.01).onChange(updateUniforms)

const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () => {
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

window.addEventListener('dblclick', () => {
    const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement

    if(!fullscreenElement) {
        if(canvas.requestFullscreen) {
            canvas.requestFullscreen()
        } else if (canvas.webkitRequestFullscreen) {
            canvas.webkitRequestFullscreen()
        }
    }
    else {
        if(document.exitFullscreen) {
            document.exitFullscreen()
        }
        else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen()
        }
    }
})

const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.z = 1
scene.add(camera)

const controls = new ArcballControls( camera, canvas, scene );
controls.enableDamping = true

const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

const axes = new THREE.AxesHelper(0.2)
axes.material.depthTest = false
axes.renderOrder = 2
axes.lookAt(normal)
// axes.rotateZ(0.3)
scene.add(axes)

const textureLoader = new THREE.TextureLoader()
const segmentTexture = textureLoader.load('segment.png')
const spotTexture = textureLoader.load('spot.png')
const maskTexture = textureLoader.load('mask.png')

const particlesMaterial = new THREE.ShaderMaterial({
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexColors: true,
    vertexShader: particlesVertexShader,
    fragmentShader: particlesFragmentShader,
    uniforms:
    {
        uFlatten: { value: parameters.flatten },
        uFlip: { value: parameters.flip },
        uTime: { value: 0 },
        uArea: { value: data.area },
        uCenter: { value: center },
        uNormal: { value: normal },
        uTifsize: { value: tifsize },
        uBasevectorX: { value: basevectorX },
        uBasevectorY: { value: basevectorY },
        uTexture : { value: spotTexture },
        uSize: { value: parameters.point_size * renderer.getPixelRatio() },
    }
})

const solidMaterial = new THREE.ShaderMaterial({
    // depthWrite: false,
    // blending: THREE.AdditiveBlending,
    // vertexColors: true,
    side: THREE.DoubleSide,
    vertexShader: solidVertexShader,
    fragmentShader: solidFragmentShader,
    uniforms:
    {
        uScEnd: { value: parameters.end.sc },
        uColorEnd: { value: new THREE.Vector3(parameters.end.r, parameters.end.g, parameters.end.b) },
        uFlatten: { value: parameters.flatten },
        uFlip: { value: parameters.flip },
        uTime: { value: 0 },
        uArea: { value: data.area },
        uCenter: { value: center },
        uNormal: { value: normal },
        uTifsize: { value: tifsize },
        uBasevectorX: { value: basevectorX },
        uBasevectorY: { value: basevectorY },
        uTexture : { value: segmentTexture } 
    }
})

const maskMaterial = new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.DoubleSide,
    vertexShader: solidVertexShader,
    fragmentShader: maskFragmentShader,
    uniforms:
    {
        uAlpha: { value: 1.0 },
        uFlatten: { value: parameters.flatten },
        uFlip: { value: parameters.flip },
        uTime: { value: 0 },
        uArea: { value: data.area },
        uCenter: { value: center },
        uNormal: { value: normal },
        uTifsize: { value: tifsize },
        uBasevectorX: { value: basevectorX },
        uBasevectorY: { value: basevectorY },
        uTexture : { value: maskTexture }
    }
})

let particles, solid

function updateUniforms() {
    particlesMaterial.uniforms.uSize.value = parameters.point_size

    const quaternion = new THREE.Quaternion().setFromAxisAngle(normal, 2 * Math.PI * parameters.adjust);
    const matrix = new THREE.Matrix4().makeRotationFromQuaternion(quaternion);

    particlesMaterial.uniforms.uFlatten.value = parameters.flatten
    particlesMaterial.uniforms.uFlip.value = parameters.flip
    particlesMaterial.uniforms.uBasevectorX.value = basevectorX.clone().applyMatrix4(matrix);
    particlesMaterial.uniforms.uBasevectorY.value = basevectorY.clone().applyMatrix4(matrix);

    solidMaterial.uniforms.uFlatten.value = parameters.flatten
    solidMaterial.uniforms.uFlip.value = parameters.flip
    solidMaterial.uniforms.uBasevectorX.value = basevectorX.clone().applyMatrix4(matrix);
    solidMaterial.uniforms.uBasevectorY.value = basevectorY.clone().applyMatrix4(matrix);
    solidMaterial.uniforms.uScEnd.value = parameters.end.sc
    solidMaterial.uniforms.uColorEnd.value.set(parameters.end.r, parameters.end.g, parameters.end.b)

    maskMaterial.uniforms.uAlpha.value = parameters.alpha
    maskMaterial.uniforms.uFlatten.value = parameters.flatten
    maskMaterial.uniforms.uFlip.value = parameters.flip
    maskMaterial.uniforms.uBasevectorX.value = basevectorX.clone().applyMatrix4(matrix);
    maskMaterial.uniforms.uBasevectorY.value = basevectorY.clone().applyMatrix4(matrix);

    if (parameters.point) { particles.visible = true; solid.visible = false; }
    if (!parameters.point) { particles.visible = false; solid.visible = true; }
}

new OBJLoader().load('segment.obj', function (object) {
    const scale = 0.5 / boundingbox.length()
    const shift = center.clone().multiplyScalar(scale)

    solid = object
    solid.traverse(function(child) {
        if (child instanceof THREE.Mesh) { child.material = solidMaterial }
    });

    solid.position.sub(shift)
    solid.scale.set(scale, scale, scale)
    scene.add(solid)

    const maskMesh = new THREE.Mesh(solid.children[0].geometry, maskMaterial)
    maskMesh.position.sub(shift)
    maskMesh.scale.set(scale, scale, scale)
    scene.add(maskMesh)

    const particlesGeometry = new THREE.BufferGeometry()
    particlesGeometry.attributes.position = solid.children[0].geometry.attributes.position
    particlesGeometry.attributes.uv = solid.children[0].geometry.attributes.uv

    particles = new THREE.Points(particlesGeometry, particlesMaterial)
    particles.position.sub(shift)
    particles.scale.set(scale, scale, scale)
    scene.add(particles)

    if (parameters.point) { particles.visible = true; solid.visible = false; }
    if (!parameters.point) { particles.visible = false; solid.visible = true; }
});

const clock = new THREE.Clock()

const tick = () => {
    const elapsedTime = clock.getElapsedTime()

    controls.update()
    renderer.render(scene, camera)

    window.requestAnimationFrame(tick)
}

tick()
