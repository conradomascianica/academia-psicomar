import { mkdir,writeFile } from 'node:fs/promises';
import { renderCertificate } from '../lib/platform/certificate';
async function main(){await mkdir('test-results',{recursive:true});for(const [key,nombre,actividad] of [['normal','María González','Herramientas para la práctica clínica'],['largo','María de los Ángeles Fernández del Río y Álvarez','Formación integral en herramientas basadas en evidencia para el abordaje de situaciones complejas en la práctica clínica profesional']]){const pdf=await renderCertificate({id:'00000000-0000-4000-8000-000000000001',nombre,actividad,cargaHoraria:'12 horas',createdAt:new Date('2026-09-28T18:00:00Z')});await writeFile(`test-results/certificado-${key}.pdf`,pdf);}}
void main();
