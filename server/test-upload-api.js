const fs = require('fs');
const path = require('path');

async function runTests() {
  console.log('--- Programmatic API Verification ---');
  const baseUrl = 'http://localhost:5000/api';

  try {
    // 1. Authenticate / Sync Teacher to get token
    console.log('\n1. Syncing seed teacher...');
    const jwt = require('jsonwebtoken');
    const header = { alg: "none", typ: "JWT" };
    const payload = {
      user_id: 'seed_teacher_firebase_uid_123',
      email: 'seed.teacher@classportal.com',
      name: 'Seed Teacher',
      aud: 'mock-project-id',
      exp: Math.floor(Date.now() / 1000) + 60 * 60
    };
    const base64UrlEncode = (obj) => {
      return Buffer.from(JSON.stringify(obj))
        .toString('base64')
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");
    };
    const idToken = `${base64UrlEncode(header)}.${base64UrlEncode(payload)}.`;

    const syncRes = await fetch(`${baseUrl}/auth/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken, role: 'Teacher', name: 'Seed Teacher' })
    });
    
    if (!syncRes.ok) {
      throw new Error(`Sync failed: ${syncRes.status} ${await syncRes.text()}`);
    }
    const syncData = await syncRes.json();
    const token = syncData.token;
    console.log('✅ Sync successful. Backend JWT retrieved.');

    // 2. Upload file via POST /api/upload
    console.log('\n2. Uploading material...');
    const formData = new FormData();
    const filePath = path.join(__dirname, '../scratch/test_material.txt');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const blob = new Blob([fileContent], { type: 'text/plain' });
    formData.append('file', blob, 'test_material.txt');
    formData.append('subject', 'Math');
    formData.append('description', 'Linear Algebra Vector Space Lecture Notes');

    const uploadRes = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!uploadRes.ok) {
      throw new Error(`Upload failed: ${uploadRes.status} ${await uploadRes.text()}`);
    }
    const uploadedMaterial = await uploadRes.json();
    console.log(`✅ Upload successful: ${uploadedMaterial.filename} (ID: ${uploadedMaterial._id})`);

    // 3. List uploaded files via GET /api/materials
    console.log('\n3. Retrieving materials...');
    const listRes = await fetch(`${baseUrl}/materials`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!listRes.ok) {
      throw new Error(`Retrieval failed: ${listRes.status} ${await listRes.text()}`);
    }
    const materials = await listRes.json();
    const found = materials.find(m => m._id === uploadedMaterial._id);
    if (found) {
      console.log(`✅ File found in repository listing: ${found.filename}`);
    } else {
      throw new Error('Uploaded file was not found in the GET /materials output');
    }

    // 4. Delete file via DELETE /api/materials/:id
    console.log(`\n4. Deleting material: ${uploadedMaterial._id}...`);
    const deleteRes = await fetch(`${baseUrl}/materials/${uploadedMaterial._id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!deleteRes.ok) {
      throw new Error(`Delete failed: ${deleteRes.status} ${await deleteRes.text()}`);
    }
    const deleteData = await deleteRes.json();
    console.log(`✅ Delete successful: ${deleteData.message}`);

    // Verify deletion
    const verifyListRes = await fetch(`${baseUrl}/materials`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const materialsAfter = await verifyListRes.json();
    const stillExists = materialsAfter.some(m => m._id === uploadedMaterial._id);
    if (!stillExists) {
      console.log('✅ File confirmed deleted from MongoDB database.');
    } else {
      throw new Error('File still exists in listing after delete request');
    }

    console.log('\n🎉 ALL ENDPOINT API TESTS COMPLETED SUCCESSFULLY!');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ API Verification Failed:', error.message);
    process.exit(1);
  }
}

runTests();
