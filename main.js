import './style.css'
import * as THREE from 'three'
import { MOUSE, TOUCH } from 'three'
import { Shader } from './Shader'
import { Grid } from './Grid'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

// Sizes
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()
    renderer.setSize(sizes.width, sizes.height)
})

// Scene
const scene = new THREE.Scene()

// Camera
const v = 0.65
const cameraShift = -0.5
const aspect = sizes.width / sizes.height
const camera = new THREE.OrthographicCamera(-v * aspect, v * aspect, v, -v, 0.01, 100)
camera.position.set(cameraShift, -3, 0)
camera.up.set(0, 0, 1)
camera.lookAt(cameraShift, 0, 0)
scene.add(camera)

// Plane
const geometry = new THREE.PlaneGeometry(1, 1, 10, 10)
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
const gridList = []

async function init() {
    const { segment } = await fetch('meta.json').then((res) => res.json())

    let ds = 0
    let wp = 0
    const h = 1
    const st = 0.02

    for (let i = 0; i < 53; i++) {
        // this parts need to recaculate in the future
        const w = (160 + (308 - 160) * (i / 52)) / 1576
        ds -= (w + wp) / 2 / h
        wp = w
        gridList.push(ds + w / h / 2)

        const gridGeometry = new THREE.PlaneGeometry(1, 1, 1, 1)
        const gridMaterial = new Grid()
        const grid = new THREE.Mesh(gridGeometry, gridMaterial)
        grid.rotation.set(Math.PI / 2, 0, 0)
        grid.position.set(ds, 0, 0)
        grid.scale.set(w / h, 1.0, 1.0)
        scene.add(grid)
    }
    gridList.push(ds - wp / h / 2)

    for (let i = 1; i < 2; i++) {
        const { id: segID, positions, scale, offset, chunks } = segment[i]
        const posTexture = await new THREE.TextureLoader().loadAsync(`${segID}/${positions}`)

        for (let j = 0; j < chunks.length; j++) {
            const { id, uv, width, height, l, r } = chunks[j]
            const uvTexture = await new THREE.TextureLoader().loadAsync(`${segID}/${uv}`)

            let pos = getPosition(id + 0.5)
            const material = setMaterial(posTexture, uvTexture)
            const mesh = new THREE.Mesh(geometry, material)
            mesh.position.set(pos, st, 0)
            mesh.userData.segID = segID
            mesh.userData.id = id
            mesh.userData.startPos = mesh.position.clone()
            mesh.userData.originPosX = mesh.position.x
            meshList.push(mesh)

            const gridW = Math.abs(gridList[id + 1] - gridList[id])
            mesh.scale.z = scale

            // fit width into the grid
            if (j === 0) {
                pos = gridList[id + 1] + width / height * (0.5 - l / width) * 1.0
                mesh.scale.x = width / height
            } else if (j === chunks.length - 1) {
                pos = gridList[id] - width / height * (0.5 - r / width) * 1.0
                mesh.scale.x = width / height
            } else {
                const ea = (r + l) / width
                const d = ea / (1 - ea)
                pos += d * gridW * (r - l) / (r + l) / 2
                mesh.scale.x = (1 + d * 1.00) * gridW
            }
            mesh.position.set(pos, st, 0)
            mesh.position.z = offset
        }
    }

    meshList.forEach((mesh) => scene.add(mesh))
    render()
}
init()

// GUI
const params = { wrapping: 0 }

const gui = new GUI()
gui.add(params, 'wrapping', 0, 52.99, 0.01).name('wrapping').listen().onChange(updateWrapping)

// Renderer
const canvas = document.querySelector('.webgl')

const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(sizes.width, sizes.height)

const c = 0.006
const mark = new THREE.Mesh(new THREE.SphereGeometry(c, 10, 10), new THREE.MeshBasicMaterial({ color: 0x00ff00 }))
mark.position.set(0, 0, 0.5)
scene.add(mark)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = false
controls.screenSpacePanning = true
controls.target.x = camera.position.x
controls.mouseButtons = { LEFT: MOUSE.PAN, MIDDLE: MOUSE.PAN, RIGHT: MOUSE.PAN }
controls.touches = { ONE: TOUCH.PAN, TWO: TOUCH.PAN }
controls.addEventListener('change', updateControls)
controls.update()

// Render
function render() {
    renderer.render(scene, camera)
}
render()

function updateControls() {
    const pos = getPosition(params.wrapping)
    if (camera.position.x < pos + cameraShift) { render(); return }

    const tpos = Math.min(camera.position.x - cameraShift, 0)
    mark.position.x = tpos
    params.wrapping = getWrap(tpos).toFixed(2)

    render()
}

function updateWrapping() {
    const pos = getPosition(params.wrapping)
    mark.position.x = pos
    camera.position.x = Math.min(camera.position.x, pos + cameraShift)
    controls.target.x = camera.position.x

    render()
}

function getPosition(wrapping) {
    if (!gridList.length) return 0

    const f = wrapping
    const s = Math.floor(f)
    const w = f - s  
    const pos = (1 - w) * gridList[s] + w * gridList[s + 1]

    return pos
}

function getWrap(pos) {
    if (!gridList.length) return 0

    let s = 0
    while (gridList[s + 1] > pos) { s++ }

    const w = (pos - gridList[s]) / (gridList[s + 1] - gridList[s])
    const wrapping = s + w

    return wrapping
}

function setMaterial(posTexture, uvTexture) {
    const material = new Shader()
    posTexture.minFilter = THREE.NearestFilter
    posTexture.magFilter = THREE.NearestFilter
    material.uniforms.tPosition.value = posTexture

    uvTexture.minFilter = THREE.NearestFilter
    uvTexture.magFilter = THREE.NearestFilter
    material.uniforms.tUV.value = uvTexture

    return material
}



