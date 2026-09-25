import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const data=JSON.parse(readFileSync(new URL('../src/data/venues.json',import.meta.url),'utf8'));
test('public data has unique valid relations, complete regional selection and source provenance',()=>{
 assert.equal(data.districts.length,45);assert.equal(data.districts.filter(d=>d.type==='Landkreis').length,36);assert.equal(data.districts.filter(d=>d.type==='Kreisfreie Stadt').length,8);
 for(const list of [data.districts,data.venues,data.events])assert.equal(new Set(list.map(item=>item.id)).size,list.length);
 assert.ok(data.venues.length>0);const districts=new Set(data.districts.map(d=>d.id));const venues=new Set(data.venues.map(v=>v.id));
 for(const venue of data.venues){assert.ok(districts.has(venue.districtId));assert.ok(venue.childFriendlyEvidence);assert.ok(Number.isFinite(Date.parse(venue.checkedAt)));for(const field of ['website','sourceUrl','programUrl'])if(venue[field])assert.equal(new URL(venue[field]).protocol,'https:');}
 for(const event of data.events){assert.ok(venues.has(event.venueId));assert.match(event.date,/^\d{4}-\d{2}-\d{2}$/);assert.equal(new URL(event.sourceUrl).protocol,'https:');}
});
