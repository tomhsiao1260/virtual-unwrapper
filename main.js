import './style.css'
import * as THREE from 'three'
import { MOUSE, TOUCH } from 'three'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min'
import { DragControls } from 'three/addons/controls/DragControls.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Shader } from './Shader'
import { Grid } from './Grid'

// Sizes
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Save sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
})

// Scene
const scene = new THREE.Scene()

// Camera
const aspect = sizes.width / sizes.height
const camera = new THREE.OrthographicCamera(-1 * aspect, 1 * aspect, 1, -1, 0.01, 100)
camera.position.set(0, -3, 0)
camera.up.set(0, 0, 1)
camera.lookAt(0, 0, 0)
scene.add(camera)

// Plane
const geometry = new THREE.PlaneGeometry(1, 1, 100, 100)
const positions = geometry.getAttribute('position').array

for (let i = 0; i < positions.length / 3; i++) {
    const xo = positions[3 * i + 0]
    const yo = positions[3 * i + 1]
    const zo = positions[3 * i + 2]

    positions[3 * i + 0] = xo
    positions[3 * i + 1] = zo
    positions[3 * i + 2] = yo
}

const meshList = []
const target = { mesh: null }

async function init() {
    const { segment, grid } = await fetch('meta.json').then((res) => res.json())

    for (let i = 0; i < segment.length; i++) {
        const { id, labels, positions, chunks } = segment[i]
        const posTexture = await new THREE.TextureLoader().loadAsync(`${id}/${positions}`)
        const labTexture = await new THREE.TextureLoader().loadAsync(`${id}/${labels}`)

        for (let j = 0; j < chunks.length; j++) {
            const { uv, d, width, height, l, r } = chunks[j]
            const uvTexture = await new THREE.TextureLoader().loadAsync(`${id}/${uv}`)
            const dTexture = await new THREE.TextureLoader().loadAsync(`${id}/${d}`)

            const material = setMaterial(posTexture, labTexture, uvTexture, dTexture)
            const mesh = new THREE.Mesh(geometry, material)
            mesh.scale.set(width / height, 1, 1)
            meshList.push(mesh)
        }
    }

    let ds = 0
    let wp = 0

    grid.forEach((w, i) => {
        const h = 1576
        ds -= (w + wp) / 2 / h
        wp = w

        const gridGeometry = new THREE.PlaneGeometry(1, 1, 1, 1)
        const gridMaterial = new Grid()
        const grid = new THREE.Mesh(gridGeometry, gridMaterial)
        grid.rotation.set(Math.PI / 2, 0, 0)
        grid.position.set(ds, -0.01, 0)
        grid.scale.set(w / h, 1.0, 1.0)
        scene.add(grid)
    })

    meshList.forEach((mesh) => scene.add(mesh))
    target.mesh = meshList[0]
    render()
}
init()

// GUI
const params = { flatten: 1, left: 0, right: 0, top: 0, bottom: 0 }

const gui = new GUI()
gui.add(params, 'flatten', 0, 1, 0.01).name('flatten').listen().onChange(render)
gui.add(params, 'left', 0, 1, 0.01).name('left').listen().onChange(render)
gui.add(params, 'right', 0, 1, 0.01).name('right').listen().onChange(render)
gui.add(params, 'top', 0, 1, 0.01).name('top').listen().onChange(render)
gui.add(params, 'bottom', 0, 1, 0.01).name('bottom').listen().onChange(render)

// Renderer
const canvas = document.querySelector('.webgl')
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(sizes.width, sizes.height)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = false
controls.screenSpacePanning = true
controls.mouseButtons = { LEFT: MOUSE.PAN, MIDDLE: MOUSE.PAN, RIGHT: MOUSE.PAN }
controls.touches = { ONE: TOUCH.PAN, TWO: TOUCH.PAN }
controls.addEventListener('change', render)

const drag = new DragControls(meshList, camera, canvas)
drag.addEventListener('dragstart', (e) => {
    controls.enabled = false
    target.mesh = e.object
    setParameters()
})
drag.addEventListener('dragend', () => { controls.enabled = true })
drag.addEventListener('drag', () => {
    target.mesh.position.y = 0
    render()
})

// Render
function render() {
    if (!target.mesh) return

    target.mesh.material.uniforms.uFlatten.value = params.flatten
    target.mesh.material.uniforms.uLeft.value = params.left
    target.mesh.material.uniforms.uRight.value = params.right
    target.mesh.material.uniforms.uTop.value = params.top
    target.mesh.material.uniforms.uBottom.value = params.bottom

    renderer.render(scene, camera)
}
render()

function setMaterial(posTexture, labTexture, uvTexture, dTexture) {
    const material = new Shader()
    posTexture.minFilter = THREE.NearestFilter
    posTexture.magFilter = THREE.NearestFilter
    material.uniforms.tPosition.value = posTexture

    labTexture.minFilter = THREE.NearestFilter
    labTexture.magFilter = THREE.NearestFilter
    material.uniforms.tLabel.value = labTexture

    uvTexture.minFilter = THREE.NearestFilter
    uvTexture.magFilter = THREE.NearestFilter
    material.uniforms.tUV.value = uvTexture

    dTexture.minFilter = THREE.NearestFilter
    dTexture.magFilter = THREE.NearestFilter
    material.uniforms.tDistance.value = dTexture

    return material
}

function setParameters() {
    params.flatten = target.mesh.material.uniforms.uFlatten.value
    params.left = target.mesh.material.uniforms.uLeft.value
    params.right = target.mesh.material.uniforms.uRight.value
    params.top = target.mesh.material.uniforms.uTop.value
    params.bottom = target.mesh.material.uniforms.uBottom.value
}

