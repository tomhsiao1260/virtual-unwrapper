import * as THREE from 'three'
import GUI from 'lil-gui'

import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

import vertexShader from './shaders/vertex.glsl'
import fragmentShader from './shaders/fragment.glsl'

const canvas = document.querySelector('canvas.webgl')
const scene = new THREE.Scene()

const loader = new OBJLoader()
const gui = new GUI()

const axes = new THREE.AxesHelper(5)
axes.material.depthTest = false
axes.renderOrder = 2

let material;
let m;

const parameters = {
    speed: 0,
    size: 200,
    flatten: 0,
}

function updateUniforms() {
    if (material) {
        material.uniforms.uSize.value = parameters.size
        material.uniforms.uFlatten.value = parameters.flatten
    }
    if (m) {
        m.uniforms.uSize.value = parameters.size
        // m.uniforms.uFlatten.value = parameters.flatten
    }
}

loader.load('20230503225234.obj', function (object) {

    fetch('20230503225234.json')
        .then(response => response.json())
        .then(data => {
            const center = new THREE.Vector3().fromArray(data.center)
            const normal = new THREE.Vector3().fromArray(data.normal)
            const tifsize = new THREE.Vector2().fromArray(data.tifsize)
            const eigenvectorX = new THREE.Vector3().fromArray(data.eigenvectors[0])
            const eigenvectorY = new THREE.Vector3().fromArray(data.eigenvectors[1])

            const center_ = center.clone().multiplyScalar(0.1)
            object.position.sub(center_)
            object.scale.set(0.1, 0.1, 0.1)

            axes.lookAt(normal)
            // axes.up.copy(eigenvectorY);
            axes.rotateZ(0.3)
            scene.add(axes)

            scene.add(object)
            scene.add(axes)

            material = new THREE.ShaderMaterial({
                depthWrite: false,
                blending: THREE.AdditiveBlending,
                vertexColors: true,
                vertexShader: vertexShader,
                fragmentShader: fragmentShader,
                uniforms:
                {
                    uFlatten: { value: parameters.flatten },
                    uTime: { value: 0 },
                    uArea: { value: data.area },
                    uSize: { value: parameters.size },
                    uCenter: { value: center },
                    uNormal: { value: normal },
                    uTifsize: { value: tifsize },
                    uEigenvectorX: { value: eigenvectorX },
                    uEigenvectorY: { value: eigenvectorY },
                }
            })

            gui.add(parameters, 'speed').min(0).max(10).step(0.01).onChange(updateUniforms)
            gui.add(parameters, 'size').min(10).max(1000).step(1).onChange(updateUniforms)
            gui.add(parameters, 'flatten').min(0).max(1).step(0.01).onChange(updateUniforms)

            const geometry = new THREE.BufferGeometry()
            geometry.attributes.position = object.children[0].geometry.attributes.position
            geometry.attributes.uv = object.children[0].geometry.attributes.uv
        
            const particles = new THREE.Points(geometry, material)
            particles.position.sub(center_)
            particles.scale.set(0.1, 0.1, 0.1)

            scene.add(particles)

            object.traverse(function(child) {
                if (child instanceof THREE.Mesh) {
                    m = new THREE.ShaderMaterial({
                        depthWrite: false,
                        blending: THREE.AdditiveBlending,
                        vertexColors: true,
                        side: THREE.DoubleSide,
                        vertexShader: vertexShader,
                        fragmentShader: fragmentShader,
                        uniforms:
                        {
                            uFlatten: { value: parameters.flatten },
                            uTime: { value: 0 },
                            uArea: { value: data.area },
                            uSize: { value: parameters.size },
                            uCenter: { value: center },
                            uNormal: { value: normal },
                            uTifsize: { value: tifsize },
                            uEigenvectorX: { value: eigenvectorX },
                            uEigenvectorY: { value: eigenvectorY },
                        }
                    })
                    child.material = m;
                }
            });
        });
});

const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
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

const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 1000)
camera.position.z = 30
scene.add(camera)

const ambientLight = new THREE.AmbientLight( 0xcccccc, 0.4 );
scene.add( ambientLight );

const pointLight = new THREE.PointLight( 0xffffff, 0.8 );
camera.add( pointLight );

const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

const clock = new THREE.Clock()

const tick = () => {
    const elapsedTime = clock.getElapsedTime()

    controls.update()
    renderer.render(scene, camera)
    // axes.rotateZ(0.01)
    if (material) material.uniforms.uTime.value = elapsedTime * parameters.speed / Math.PI

    window.requestAnimationFrame(tick)
}

tick()
