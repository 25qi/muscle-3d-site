import { NodeIO } from '@gltf-transform/core';
import { MeshoptDecoder } from 'meshoptimizer';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.decoder': MeshoptDecoder });

async function inspect(path) {
  const doc = await io.read(path);
  const root = doc.getRoot();
  const meshes = root.listMeshes();
  const nodes = root.listNodes();
  // node 名稱才是 R3F scene.traverse 拿到的 object.name
  const meshNodeNames = nodes
    .filter((n) => n.getMesh())
    .map((n) => n.getName());
  return {
    meshCount: meshes.length,
    meshNodeCount: meshNodeNames.length,
    meshNames: meshes.map((m) => m.getName()),
    nodeNames: meshNodeNames,
  };
}

for (const f of process.argv.slice(2)) {
  const r = await inspect(f);
  console.log(`\n=== ${f} ===`);
  console.log('mesh count      :', r.meshCount);
  console.log('mesh-node count :', r.meshNodeCount);
  console.log('first 30 node names:');
  console.log(JSON.stringify(r.nodeNames.slice(0, 30), null, 1));
}
