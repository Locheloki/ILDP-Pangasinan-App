const fs = require("fs");
const path = require("path");

const DB_FILE = path.join(__dirname, "..", "database", "db.json");

const newlyHiredRaw = `Sibayan, Rona A.
Bactad, Micaella Tambong
Dagdag, Bernadeth Familara
Duot, Raymond Christofer Tactay
Desalia, Camille Fernandez
Tinozo, Eloisa Joyce Faye Castro
Bataan, Rey Noel E.
Petaca, Anjoneil
Ranque, Angeli Mae A.
Saure, Krisha Mae
Tiquison, Jr., Luis T.
Lagare, Johnson
Peralta, Mary Carieky Cate T.
Dr. Alyssa Joi C. Masaoy
Dr. Richard A. Billote
Salazar, Daryl Ramos
Villanueva, Jaimee Lyn Cruz
Begenio, Armiel Sison
Estrada, Regina Judith Tomelden
Lameg, Michael Kearney Caronongan
Prestoza, Fernand Mondero
Dr. Altifanie F. Miranda
Dr. Regulus C. Reyes, Jr.
Manuel, Justine Kirk Quitaleg
Dr. Valleden L. Bancod
De Galicia, Jan Maureen Boston
Untalan, Gale Ann Palagud
Suaso, Alaine Nicole Salunga
Dr. Bea O. Cardinoza
Aviles, Joyce Karen V.
Dr. Kate C. Del Rosario
Dr. Patricia Felise N. Perez
Dr. Razel Neferth Perez
Alejo, Kristian Joshua
Aquino, Beverly N,
Gonzales, Jowel
Matudio, Merry Anne T.
Palabrica, Aliana Felix V.
Rosario, Kejome V.
Sabado, Joan Leslie
Sze, Beverly F.
Unating, Jennifer P.
Beguas, Jay-Ann G.
Domalanta, Joey V.
Ferrer, Melyn G.
Flores, Philip M.
Mamaril, Roberto F.
Dr. Gelen C. Martinez
Dr. Ma. Kristina Cassandra C. Dionisio
Dela Cruz, Jose Pepito Bautista
Dr.Harbe V. Frugalidad
Montemayor, Marlon T.
Rebudan, Mel Cedrick Gale
Dr. Ernest James P. Esteban
Aromin, Alain Solis
Dr. Carlo T. Trinidad
Dr. Jocelle H. Luna
Dulay, Avegail D.
Gorospe, Catherine C.
Bagoncia, Melvin Nacin
Reyes, Rogie Ballen
Bagoncia, Joemell Ceralde
Calpo, Elsie Laguisma
Rola, Cailey Cassidy Orine
Fernandez, Heinz Erika Gayo
Goce, Junnayka-Lyn Ariaga
Nuñez, Rizalito Soriano
Tibunsay, Jessieca Tadeo
Estrada, Princess Joy Cabutotan
Soriano, Genuel Verzola
Dr. Aervin L. Maraña
Lanuza, Jeniebel Briones
Dr. Beatrice Emmanuelle B. Garcia
Dr. Johnlyn M. De Leon
Dr. Lincoln Sam C. Disu
Dr. Danilo Philip R. Torres
Dr. Jeremie Marie A. Del Rosario
Oñate, Jean Jasmine B.
Dizon, Ermelita V.
Jucutan, Joy Lorein Tolentino
Montero, Aljen Emily Montano
Ocariza, Venice Ann Balmores
Cabael, Hannah Faith Hebaler
Dr. Emily Ross M. Rosario
Torio, Melchizedek Tagarino
Drapiza, Joshua Edward Castañeda
Bestre, Jimzon Allasio
Segundo, Jassen Yani
Torio, King Rabago
Romero, Laureta De Guzman
Antonio, Erika Mae Bauzon
Caagusan, Dan Claude Conde
Francisco, Denisse Mauline G.
Sanchez, Audey Ann Labios
Dr. Nikka Angelique T. Sison
Armario, Cyril A.
Caacbay, Cindy Pearl Sison
Domondon, Anghelica Magno
Dumantay, Alyssa Marie Cañedo
Garcia, Chevvy Ann Luken
Danao, Kelvin Albert Austria
Bustejer, Bhea Mae Necesito
Lagria, John Ray Dela Cruz
Orozco, Dominic Dela Cruz
Raguin, Mark Lester Barracas
Reyes, Matthew Besenio
Tocdangan, Meriam Pucayen
Dr. Hans Egon M. Lacasandile
Escosio, Dimple C,
Dr. Denise Martha P. De Vera
Dr. Mariah Carla D. Gonzales
Dr. Arianne Jenelle C. Zacarias-Baldeo
Dr. Daryl M. Andaya
Delos Santos, Bryan Nicole
Millevo, Christian
Verazon, Rodel
Calimoso, Queen Justine Ely Pascua
Escosio, Reena Azley Lolarga
Prestoza, Lyza mae Ramos
Francisco, Melyrizza Jil Lagmay
Malicdem, Julie Mae Remillosa
Perez, Julius Andrian Caparas
Ariola, King M.
Tañedo, Katherine Vino
Dr. Ma. Vanessa I. Yu
Dr. Elmer Patrick P. Mariano
Dr. Jessica Bren S. Cezar
Dr. Josef Christer M. Ybañez
Escat, Sheila Nicole Carbonillo
Laplana, Marvie Andrada
Macaraeg, Luke Marquez
Macaraeg, Rechelle Doria
Taganas, Jerome Mangosong
Bautista, Leonardo Quirante
Limon, Nelson Pascua
Martinez, Mary Ann Agosto
Sotto, Hana Glenah Raymundo
Gorospe, Richard Ocenar
Licudan, John Michael
Dr. Agnes J. Cruz
Dr. Beatrix Hannah C. Tanbonliong
Dr. Ronora Grace R. Rico-Josue
Abuan, Jaymie Annejilene Tabajonda
Dr. Elezar P. Salva
Dr. Eliza Crisette C. Claudio
Dr. Mariah Carla D. Gonzales
Bulatao, Warren
Caguioa, Mc Xander De Vera
De Guzman, Justin Carlo Zabala
De Guzman, Marienne
Del Rosario, Rheizel
Dela Cruz, Cassandra Grace Muerong
Diadid, Mikaela Ghea
Dimaano, Nesiele De Guzman
Doldol, Kyla Mae Lovedioro
Espinas, Mena Criselda Aquino
Ignacio, Jonalyn Asuzano
Macasieb, Joshua Ceasar Catambing
Montemayor, Ma. Daniela Rose Martinez
Palaganas, Kyfer
Palisoc, Charls Eman Bugarin
Perez, Arabilla Grace
Rosario, Kristine Diaz
Sadueste, Daniel Cruz
Ugto, Sophia Nicole Tenorio
Victorio, Lovella
Cerezo, Ashbelle Rhose Abejuela
Duarte, Ma. Rafaela Episcope
Lardizabal, Jelian Facun
Mairina, Shania
Mendoza, Jay Ann Dacasin
Rosario, Abegail
Verceles, Mark Joseph Caguioa
Agustin, Mark Jerome Galisim
Cancino, John Harold Datuin
De Guzman, Prince Jefferson Egonia
Estrada, Nicole Fyne
Evangelista, Ericson Aureada
Ildefonso, Angelo Cayabyab
Junio, Ranjet Dagang
Padua, Louie Ramon Dionco
Palisoc, Charlie
Peralta, Frankie
Poquiz, Jachel De Guzman
Raposas, Jansen Reeve Arenas
Resquid, Diether Pungyan
Rosario, Guada Jennie Sandoval
Rosario, Jessa May Soriano
Valerio, Jack Lester Bautista
De Venecia, Chiradee Bernardino
Lopez, Marc Roi Aquino
Ricafort, Michelle Steffi Mapili
Dr. Alexis Julianne A. Teja
Dr. Nelmida R. Ramos
Dr. Sharah Mae L. Epie
Adlao, Jesramael Fuentes
Enrile, Jan Marc Mateo
De Vera, Venice Angelo Estrada
Burgos, Mark Darren Aquino
Dr. Ara Shiela R. Esteban
Dr. Vic Cedrych S. Pagbilao
Quiton, Irah Alexandra Alqueza
Dr. Emmylou L. Ortega
Dr. Leslee C. Bernardino
Sotelo, Rigor Fabor
Carlos, Jonathan T.
Ancheta, Neil John Adona
Ayson, Paul Arjohn Bustamante
Balingit, Ethel Tomboc
Andrada, Bea M.
Manzano, Jenan P.
Pajarillo, Cyrence Joy A.
Villanueva, Consolacion C.
Cruz, Melanie Bundame
Dr. Arlee C. Balderas
Dr. Charisse Joy M. Yala
Dr. Christian Jake N. Llano
Dr. Judy Lyn D. Vitug
Pasaoa, Marcel Gabriel Domingo
Lagula, Fatima Joy Marquez
Membrere, Jayvee Matias
Pastor, Mark Lester Lucena
Fernandez, Francesca Beatrice M
De Guzman, Jerome C.
Baldueza, Katherine P.
Salazar, Kyla Christopher M.
Briones, Karen Anne
Villanueva, Jamiee Lyn`;

const reemployedRaw = `Dr. Imelda D. Manansala
Dr. Lovely Robyn B. Quiros
Pruna, Kristine Sarmiento
Dela Cruz, Jose Pepito Bautista
Bonsato, Jonard Almodovar
Dona, Catherine Cabanada
Junio, Kelli Rae Fernando
Dela Cruz, Irene Reloza
Go, Monica Samilin
Dr. Kathleen M. De Vera
Garcia, Kristine Jane Agustin
Lagota, Jessica Dela Cruz
Ventenilla, Elingier Fernandez
Gabuyan, John Ray Magalong
Dr. Marc Benoe G. Raguindin`;

function normalize(str) {
  return (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Parse entries from raw text
function parseEntries(raw) {
  const entries = [];
  const lines = raw.split("\n").map(l => l.trim()).filter(Boolean);
  for (const line of lines) {
    let cleaned = line.replace(/^Dr\.\s*/i, "").trim();
    cleaned = cleaned.replace(/,?\s*Jr\.?\s*$/i, "").trim();

    const commaIdx = cleaned.indexOf(",");
    if (commaIdx === -1) {
      // "First Last" format (e.g. "Imelda D. Manansala")
      entries.push({ raw: line, last: "", fullName: cleaned });
      continue;
    }

    const last = cleaned.substring(0, commaIdx).trim();
    const fullName = cleaned.substring(commaIdx + 1).trim();
    entries.push({ raw: line, last, fullName });
  }
  return entries;
}

// Improved matching: tries multiple strategies
function matchEmployee(emp, entry) {
  const empLast = normalize(emp.LastName);
  const empFirst = normalize(emp.FirstName);
  const empMI = normalize(emp.MiddleInitial || "").replace(/\.$/, "");
  const empFullName = normalize(`${emp.FirstName} ${emp.MiddleInitial || ""}`);
  const targetLast = normalize(entry.last);

  // If entry has no last name (First Last format), skip last name check
  // and try matching full name differently
  if (!entry.last) {
    // "First Last" format like "Imelda D. Manansala"
    // entry.fullName = "Imelda D. Manansala"
    const nameParts = entry.fullName.split(/\s+/);
    const entryLast = nameParts[nameParts.length - 1];
    const entryFirstParts = nameParts.slice(0, -1);
    
    if (normalize(entryLast) !== empLast) return false;
    
    const entryFirst = entryFirstParts.join(" ");
    const entryFirstNorm = normalize(entryFirst);
    
    // Try matching against empFirstName or empFullName
    if (empFirst.includes(entryFirstNorm) || entryFirstNorm.includes(empFirst)) return true;
    if (empFullName.includes(entryFirstNorm)) return true;
    
    // Try first name base match
    const entryFirstBase = entryFirstNorm.split(/\s+/)[0];
    if (empFirst.startsWith(entryFirstBase) || entryFirstBase.startsWith(empFirst.split(/\s+/)[0])) {
      return true;
    }
    
    return false;
  }

  // Standard "Last, FullName" format
  if (empLast !== targetLast) return false;

  // Build the full name pattern from entry: "FirstName MI1 MI2 ..."
  // Single letters in entry.fullName could be MIs OR part of first name
  const entryTokens = entry.fullName.split(/\s+/).filter(Boolean);
  
  // Strategy 1: Try matching entire entry fullName against empFirstName
  const entryFullNorm = normalize(entry.fullName);
  if (empFirst === entryFullNorm) return true;
  if (empFirst.includes(entryFullNorm)) return true;
  if (entryFullNorm.includes(empFirst)) return true;

  // Strategy 2: First token is first name, rest might be MIs or name parts
  const entryFirstName = normalize(entryTokens[0]);
  const empFirstBase = empFirst.split(/\s+/)[0];
  
  if (empFirstBase !== entryFirstName) return false;

  // First name base matches - now check middle parts
  if (entryTokens.length === 1) {
    // Entry only has first name - match!
    return true;
  }

  // Entry has additional tokens after first name
  // Collect entry MIs (single letters) and name parts (multi-char)
  const entryMIs = [];
  const entryNameParts = [entryFirstName];
  
  for (let i = 1; i < entryTokens.length; i++) {
    const token = normalize(entryTokens[i]);
    const clean = token.replace(/\.$/, "");
    if (clean.length === 1) {
      entryMIs.push(clean);
    } else {
      entryNameParts.push(token);
    }
  }

  // Check if remaining name parts match empFirstName or empMI
  const remainingParts = entryNameParts.slice(1); // Skip first name
  
  if (remainingParts.length > 0) {
    // Check if remaining parts are contained in empFirstName
    const empFirstParts = empFirst.split(/\s+/);
    for (const part of remainingParts) {
      const partNorm = normalize(part);
      // Check if this part exists in empFirstName
      const found = empFirstParts.some(p => p === partNorm || p.includes(partNorm) || partNorm.includes(p));
      if (!found) {
        // Also check against empMI
        if (empMI !== partNorm.replace(/\.$/, "")) {
          return false;
        }
      }
    }
  }

  // Check MIs match
  if (entryMIs.length > 0) {
    // At least one entry MI should match empMI
    if (empMI && entryMIs.includes(empMI)) return true;
    // If emp has no MI but entry has MI, check if MI part is in empFirstName
    if (!empMI) {
      for (const mi of entryMIs) {
        if (empFirst.includes(mi)) return true;
      }
      // Also check if the entry full name without MIs matches emp first name
      const withoutMIs = remainingParts.join(" ");
      if (withoutMIs && empFirst.includes(normalize(withoutMIs))) return true;
      return false;
    }
    return false;
  }

  // No MIs in entry, just name parts - already validated above
  return true;
}

function main() {
  console.log("Reading database...");
  const db = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
  const employees = db.employees;
  console.log(`Total employees in DB: ${employees.length}`);

  // Reset all NewlyHired fields first
  for (const emp of employees) {
    emp.NewlyHired = "N/A";
  }

  const newlyHiredEntries = parseEntries(newlyHiredRaw);
  const reemployedEntries = parseEntries(reemployedRaw);

  console.log(`\nNewly Hired entries to match: ${newlyHiredEntries.length}`);
  console.log(`Reemployed entries to match: ${reemployedEntries.length}`);

  let matchedNewlyHired = 0;
  let matchedReemployed = 0;
  let unmatchedNewlyHired = [];
  let unmatchedReemployed = [];
  let matchedEmployeeIds = new Set();

  // Process Newly Hired
  for (const entry of newlyHiredEntries) {
    const matches = employees.filter((emp) => matchEmployee(emp, entry));
    if (matches.length > 0) {
      for (const match of matches) {
        match.NewlyHired = "Newly Hired";
        matchedEmployeeIds.add(match.EmployeeID);
      }
      matchedNewlyHired++;
    } else {
      unmatchedNewlyHired.push(entry);
    }
  }

  // Process Reemployed
  for (const entry of reemployedEntries) {
    const matches = employees.filter((emp) => matchEmployee(emp, entry));
    if (matches.length > 0) {
      for (const match of matches) {
        match.NewlyHired = "Reemployed";
        matchedEmployeeIds.add(match.EmployeeID);
      }
      matchedReemployed++;
    } else {
      unmatchedReemployed.push(entry);
    }
  }

  console.log(`\n=== RESULTS ===`);
  console.log(`Matched Newly Hired entries: ${matchedNewlyHired} / ${newlyHiredEntries.length}`);
  console.log(`Matched Reemployed entries: ${matchedReemployed} / ${reemployedEntries.length}`);
  console.log(`Total employees matched: ${matchedEmployeeIds.size}`);
  console.log(`Employees marked N/A: ${employees.filter(e => e.NewlyHired === "N/A").length}`);

  if (unmatchedNewlyHired.length > 0) {
    console.log(`\n--- UNMATCHED NEWLY HIRED (${unmatchedNewlyHired.length}) ---`);
    for (const ue of unmatchedNewlyHired) {
      console.log(`  ${ue.raw}`);
    }
  }

  if (unmatchedReemployed.length > 0) {
    console.log(`\n--- UNMATCHED REEMPLOYED (${unmatchedReemployed.length}) ---`);
    for (const ue of unmatchedReemployed) {
      console.log(`  ${ue.raw}`);
    }
  }

  // Write back
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  console.log("\nDatabase updated successfully!");
}

main();
