import './style.css'
import * as THREE from 'three'
import { MOUSE, TOUCH } from 'three'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min'
import { DragControls } from 'three/addons/controls/DragControls.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { TIFFLoader } from 'three/addons/loaders/TIFFLoader.js'
import { Shader } from './Shader'
import { Grid } from './Grid'
import { Test } from './Test'

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
const geometry = new THREE.PlaneGeometry(1, 1, 200, 2000)
// const geometry = new THREE.PlaneGeometry(1, 1, 50, 350)
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
const gridList = []
const st = 0.02

async function init() {
    const { segment, grid: g } = await fetch('meta.json').then((res) => res.json())

    let ds = 0
    let wp = 0
    const h = 1576

    // for (let i = 0; i < g.length; i++) {
    //     const w = g[i]
    for (let i = 0; i < 61; i++) {
        // this parts need to recaculate in the future
        let w;
        w = 130 + (308 - 130) * (i / 60)
        // still can't fit well for the first one
        if (i < 8) w = 100 + (130 - 100) * (i / 7)
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

    for (let i = 0; i < segment.length; i++) {
    // for (let i = 0; i < 1; i++) {
        const { id: segID, labels, positions, normals, texture, scale, offset, chunks } = segment[i]
        const posTexture = await new THREE.TextureLoader().loadAsync(`${segID}/${positions}`)
        const normalTexture = await new THREE.TextureLoader().loadAsync(`${segID}/${normals}`)
        const surfTexture = await new TIFFLoader().loadAsync(`${segID}/${texture}`)
        // const labTexture = await new THREE.TextureLoader().loadAsync(`${segID}/${labels}`)
        const labTexture = ''

        for (let j = 0; j < chunks.length; j++) {
            const { id, uv, d, width, height, l, r } = chunks[j]
            const uvTexture = await new THREE.TextureLoader().loadAsync(`${segID}/${uv}`)
            const dTexture = await new THREE.TextureLoader().loadAsync(`${segID}/${d}`)

            let pos = getWrapPosition(id + 0.5)
            // left & right edge rectangle position handling
            if(j === 0) pos = gridList[id + 1] + (width / 2 - l) / height
            if(j === chunks.length - 1) pos = gridList[id] - (width / 2 - r) / height

            const material = setMaterial(posTexture, normalTexture, labTexture, uvTexture, dTexture, surfTexture)
            const mesh = new THREE.Mesh(geometry, material)
            mesh.scale.set(width / height, 1, 1)
            mesh.position.set(pos, st, 0)
            mesh.userData.segID = segID
            mesh.userData.id = id
            mesh.userData.startPos = mesh.position.clone()
            mesh.userData.originPosX = mesh.position.x
            meshList.push(mesh)

            mesh.scale.z = scale
            // fit width into the grid
            if (j !== 0 && j !== chunks.length - 1) {
                // this is a shifting bug
                const sh = i ? 4 : 10
                mesh.scale.x = (l + r + sh) / height + Math.abs(gridList[id + 1] - gridList[id])
            }
            mesh.position.z = offset
        }
    }

    meshList.forEach((mesh) => scene.add(mesh))
    target.mesh = meshList[0]
    render()
}
// init()

const testTexture = new THREE.TextureLoader().load('ok.png')
const testG = new THREE.PlaneGeometry(1, 1, 1, 1)
const testM = new Test()
testM.uniforms.t.value = testTexture
testTexture.minFilter = THREE.NearestFilter
testTexture.magFilter = THREE.NearestFilter

// const testMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1, 1, 1), new THREE.MeshBasicMaterial())
const testMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), testM)
scene.add(testMesh)

// GUI
const params = { wrapping: 0, scale: 1, offset: 0, left: 0, right: 0, top: 0, bottom: 0 }

const gui = new GUI()
gui.add(params, 'wrapping', 0, 52.99, 0.01).name('wrapping').listen().onChange(updateWrapping)
// gui.add(params, 'scale', 0, 1, 0.01).name('scale').listen().onChange(updateTransfer)
// gui.add(params, 'offset', -0.5, 0.5, 0.01).name('offset').listen().onChange(updateTransfer)
// gui.add(params, 'left', 0, 1, 0.01).name('left').listen().onChange(render)
// gui.add(params, 'right', 0, 1, 0.01).name('right').listen().onChange(render)
// gui.add(params, 'top', 0, 1, 0.01).name('top').listen().onChange(render)
// gui.add(params, 'bottom', 0, 1, 0.01).name('bottom').listen().onChange(render)

// Renderer
const canvas = document.querySelector('.webgl')
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(sizes.width, sizes.height)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = false
controls.screenSpacePanning = true
controls.target.x = camera.position.x
controls.mouseButtons = { LEFT: MOUSE.PAN, MIDDLE: MOUSE.PAN, RIGHT: MOUSE.PAN }
controls.touches = { ONE: TOUCH.PAN, TWO: TOUCH.PAN }
controls.addEventListener('change', render)
controls.update()

const keyboard = { space: false, shift: false }
window.addEventListener('keydown', (e) => {
    if (event.repeat) return
    if (e.which === 32) keyboard.space = true
    if (e.which === 16) keyboard.shift = true

    if (e.which === 32) {
        controls.mouseButtons = { LEFT: MOUSE.ROTATE, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.PAN }
        controls.touches = { ONE: TOUCH.ROTATE, TWO: TOUCH.PAN }
        controls.target.x = camera.position.x
        controls.update()
        // camera.lookAt(camera.position.x, 0, 0)
    }
})
window.addEventListener('keyup', (e) => {
    if (e.which === 32) keyboard.space = false
    if (e.which === 16) keyboard.shift = false

    if (e.which === 32) {
        controls.mouseButtons = { LEFT: MOUSE.PAN, MIDDLE: MOUSE.PAN, RIGHT: MOUSE.PAN }
        controls.touches = { ONE: TOUCH.PAN, TWO: TOUCH.PAN }
    }
})

const drag = new DragControls(meshList, camera, canvas)
drag.addEventListener('dragstart', (e) => {
    meshList.forEach((mesh) => {
        if (target.mesh.userData.segID === mesh.userData.segID) mesh.position.y = st
        if (e.object.userData.segID === mesh.userData.segID) mesh.position.y = -st
    })

    controls.enabled = false
    target.mesh = e.object

    setParameters()
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

    if(keyboard.shift) {
        const deltaX = target.mesh.position.x - target.mesh.userData.startPos.x
        const deltaY = target.mesh.position.y - target.mesh.userData.startPos.y
        const deltaZ = target.mesh.position.z - target.mesh.userData.startPos.z

        meshList.forEach((mesh) => {
            if(mesh.userData.segID !== target.mesh.userData.segID) return
            mesh.position.x = mesh.userData.startPos.x + deltaX
            mesh.position.y = mesh.userData.startPos.y + deltaY
            mesh.position.z = mesh.userData.startPos.z + deltaZ
        })
    }

    render()
})

// Render
function render() {
    // if (!target.mesh) return

    // target.mesh.material.uniforms.uLeft.value = params.left
    // target.mesh.material.uniforms.uRight.value = params.right
    // target.mesh.material.uniforms.uTop.value = params.top
    // target.mesh.material.uniforms.uBottom.value = params.bottom

    renderer.render(scene, camera)
}
render()

const c = 0.006
const mark = new THREE.Mesh(new THREE.SphereGeometry(c, 10, 10), new THREE.MeshBasicMaterial({ color: 0x00ff00 }))
mark.position.set(0, 0, 0.5)
scene.add(mark)

function updateWrapping() {
    const pos = getWrapPosition(params.wrapping)

    meshList.forEach((mesh) => {
        mesh.material.uniforms.uWrapping.value = params.wrapping
        mesh.material.uniforms.uWrapPosition.value = pos

        // temporarily fix of a weird shader position out of camera rendering bug
        const t = (mesh.userData.originPosX - 0.5) < pos
        mesh.position.x = t ? mesh.userData.originPosX : pos + 1.0
    })
    mark.position.x = pos
    camera.position.x = pos + cameraShift

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

function setMaterial(posTexture, normalTexture, labTexture, uvTexture, dTexture, surfTexture) {
    const material = new Shader()
    posTexture.minFilter = THREE.NearestFilter
    posTexture.magFilter = THREE.NearestFilter
    material.uniforms.tPosition.value = posTexture

    if (labTexture) {
        labTexture.minFilter = THREE.NearestFilter
        labTexture.magFilter = THREE.NearestFilter
        material.uniforms.tLabel.value = labTexture
    }

    // uvTexture.minFilter = THREE.NearestFilter
    // uvTexture.magFilter = THREE.NearestFilter
    material.uniforms.tUV.value = uvTexture

    // dTexture.minFilter = THREE.NearestFilter
    // dTexture.magFilter = THREE.NearestFilter
    material.uniforms.tDistance.value = dTexture

    surfTexture.minFilter = THREE.NearestFilter
    surfTexture.magFilter = THREE.NearestFilter
    material.uniforms.tSurface.value = surfTexture

    return material
}

function setParameters() {
    params.left = target.mesh.material.uniforms.uLeft.value
    params.right = target.mesh.material.uniforms.uRight.value
    params.top = target.mesh.material.uniforms.uTop.value
    params.bottom = target.mesh.material.uniforms.uBottom.value
}

function getWrapPosition(wrapping) {
    if (!gridList.length) return 0

    const f = wrapping
    const s = Math.floor(f)
    const w = f - s  
    const pos = (1 - w) * gridList[s] + w * gridList[s + 1]

    return pos
}



