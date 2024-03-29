import './style.css'
import * as THREE from 'three'
import { MOUSE, TOUCH } from 'three'
import { Shader } from './Shader'
import { Grid } from './Grid'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min'
import { TIFFLoader } from 'three/addons/loaders/TIFFLoader.js'
import { DragControls } from 'three/addons/controls/DragControls.js'
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
const gridList = []
const target = { mesh: null }

let ds = 0
let wp = 0
const h = 1
const st = 0.02

async function init() {
    const { segment } = await fetch('meta.json').then((res) => res.json())

    for (let i = 0; i < 27; i++) {
    // for (let i = 0; i < 53; i++) {
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

    for (let i = 0; i < 4; i++) {
        const { id: segID, positions, colors, scale, offset, chunks } = segment[i]
        const posTexture = await new THREE.TextureLoader().loadAsync(`${segID}/${positions}`)
        const possTexture = await new THREE.TextureLoader().loadAsync(`${segID}/s/${positions}`)
        const colorTexture = await new TIFFLoader().loadAsync(`${segID}/${colors}`)

        for (let j = 0; j < chunks.length; j++) {
            const { id, uv, width, height, l, r } = chunks[j]
            const uvTexture = await new THREE.TextureLoader().loadAsync(`${segID}/${uv}`)
            const uvsTexture = await new THREE.TextureLoader().loadAsync(`${segID}/s/${uv}`)

            let pos = getPosition(id + 0.5)
            const material = setMaterial(posTexture, possTexture, uvTexture, uvsTexture, colorTexture)
            const mesh = new THREE.Mesh(geometry, material)
            mesh.position.set(pos, st, 0)
            mesh.userData.segID = segID
            mesh.userData.id = id
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
            mesh.userData.startPos = mesh.position.clone()
            mesh.userData.originPosX = mesh.position.x
        }
    }

    meshList.forEach((mesh) => scene.add(mesh))
    target.mesh = meshList[0]
    render()
}
init()

// GUI
const params = { wrapping: 0, scale: 1, offset: 0 }

const gui = new GUI()
gui.add(params, 'wrapping', 0, 26.99, 0.01).name('wrapping').listen().onChange(updateWrapping)
// gui.add(params, 'wrapping', 0, 52.99, 0.01).name('wrapping').listen().onChange(updateWrapping)
// gui.add(params, 'scale', 0, 1, 0.01).name('scale').listen().onChange(updateTransfer)
// gui.add(params, 'offset', -0.5, 0.5, 0.01).name('offset').listen().onChange(updateTransfer)

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

// drag controls
const drag = new DragControls(meshList, camera, canvas)
drag.addEventListener('dragstart', (e) => {
    meshList.forEach((mesh) => {
        if (target.mesh.userData.segID === mesh.userData.segID) mesh.position.y = st
        if (e.object.userData.segID === mesh.userData.segID) mesh.position.y = -st
    })

    controls.enabled = false
    target.mesh = e.object

    render()
})
drag.addEventListener('dragend', (e) => {
    controls.enabled = true

    meshList.forEach((mesh) => {
        if(mesh.userData.segID !== target.mesh.userData.segID) return
        mesh.userData.startPos.x = mesh.position.x
        mesh.userData.startPos.y = mesh.position.y
        mesh.userData.startPos.z = mesh.position.z
    })

    target.mesh.userData.originPosX = target.mesh.position.x
})
drag.addEventListener('drag', (e) => {
    target.mesh.position.y = -2 * st
    render()
})

// Render
function render() {
    renderer.render(scene, camera)
}
render()

function updateControls() {
    // const pos = getPosition(params.wrapping)
    // if (camera.position.x < pos + cameraShift) { render(); return }

    // const tpos = Math.min(camera.position.x - cameraShift, 0)
    // mark.position.x = tpos
    // params.wrapping = getWrap(tpos).toFixed(2)

    // meshList.forEach((mesh) => {
    //     mesh.material.uniforms.uWrapping.value = params.wrapping
    //     mesh.material.uniforms.uWrapPosition.value = pos
    // })

    render()
}

function updateWrapping() {
    const pos = getPosition(params.wrapping)
    mark.position.x = pos
    camera.position.x = pos + cameraShift
    controls.target.x = camera.position.x

    meshList.forEach((mesh) => {
        mesh.material.uniforms.uWrapping.value = params.wrapping
        mesh.material.uniforms.uWrapPosition.value = pos

        // temporarily fix of a weird shader position out of camera rendering bug
        const t = (mesh.userData.originPosX - 0.1) < pos
        mesh.position.x = t ? mesh.userData.originPosX : pos + 1.0
    })

    render()
}

function updateTransfer() {
    const { segID } = target.mesh.userData

    meshList.forEach((mesh) => {
        if (segID !== mesh.userData.segID) return
        mesh.scale.z = params.scale
        mesh.position.z = params.offset
    })

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

function setMaterial(posTexture, possTexture, uvTexture, uvsTexture, colorTexture) {
    const material = new Shader()
    posTexture.minFilter = THREE.NearestFilter
    posTexture.magFilter = THREE.NearestFilter
    material.uniforms.tPosition.value = posTexture

    possTexture.minFilter = THREE.NearestFilter
    possTexture.magFilter = THREE.NearestFilter
    material.uniforms.tPositions.value = possTexture

    uvTexture.minFilter = THREE.NearestFilter
    uvTexture.magFilter = THREE.NearestFilter
    material.uniforms.tUV.value = uvTexture

    uvsTexture.minFilter = THREE.NearestFilter
    uvsTexture.magFilter = THREE.NearestFilter
    material.uniforms.tUVs.value = uvsTexture

    colorTexture.minFilter = THREE.NearestFilter
    colorTexture.magFilter = THREE.NearestFilter
    material.uniforms.tColor.value = colorTexture

    return material
}



