import json
import re
import random
from datetime import datetime

# Markdown lists provided in the prompt
LEARNING_NEEDS_MD = """
Planning & Development (Institutional Development) | Competency Gap | Seminar/Training on Planning & Development | 3rd Quarter of 2024
Management and Administrative Skills (Functional/ Technical) | Requirement of the position | Seminar/ Training on Administrative & Management Skills | 2nd Quarter of 2026
Financial Planning, Analysis, and Services | Competency Gap | Coaching & Mentoring | 2nd Quarter of 2024
Records & Archives Management | Requirement of the position | Coaching & Mentoring | 3rd Quarter of 2025
Property, Supplies, and Equipment Procurement | Competency Gap | Coaching & Mentoring | 4th Quarter of 2024
Enhanced Computer Operations Skills | Requirement of the position | Coaching & Mentoring | 1st Quarter of 2026
Display of Province Core Values (Core/Values Competency) | Requirement of the position | Values Restoration Drive | 4th Quarter of 2024
Processing of Financial Documents (Office Funds) | Requirement of the position | Coaching & Mentoring | 2nd Quarter of 2024
General Maintenance & Repair Skills | Requirement of the position | Coaching & Mentoring | 3rd Quarter of 2025
Effective Written & Verbal Communication Skills | Requirement of the position | Seminar/Training | 1st Quarter of 2025
Professional Knowledge on Mechanical Engineering | Licensing Requirement | Seminar/Training | 1st Quarter of 2025
Essential Driving and Vehicle Maintenance Skills | Requirement of the position | Coaching & Mentoring | 3rd Quarter of 2024
Customer Service Orientation | Advance Knowledge | Seminar/Training | 1st Quarter of 2027
Ability in Operating Cleaning Equipment and Tools | Advance Knowledge | Seminar/Training | 1st Quarter of 2026
Knowledge on Traffic Rules and Regulations | Competency Improvement | Seminar/Training | 1st Quarter of 2026
Training on Newborn Screening | Licensing Requirement | Seminar/Training | 2nd Quarter 2024 - 2027
Food Safety and Sanitation | Competency Gap | Seminar/Training | 4th Quarter of 2025
Food Handling and Service | Competency Gap | Coaching & Mentoring | 2nd Quarter of 2024
Cooking / Food Presentation | Advance Knowledge | Coaching & Mentoring | 2nd Quarter of 2024
"""

EMPLOYEES_MD = """
Vivian Lyn | E. | De Guzman | Mapandan Community Hospital | Medical Technologist
Jeffrey | C. | Jimenez | Manaoag Community Hospital | Nurse
Leihani | S. | Dela Cruz | Lingayen District Hospital | Nurse
William | R. | Delos Reyes | Provincial Engineering Office | HEO I
Edmundo | S. | De Guzman | Provincial Engineering Office | Forklift Operator
Carmelo | C. | Arce | Provincial Engineering Office | Truck Dropside with Crane Operator
Mario |  | Ancheta | Provincial Engineering Office | Heavy Equipment Operator IE
Roberto | G. | Danganan | Provincial Engineering Office | Utility Worker
James |  | Suarez | Provincial Engineering Office | Administrative Aide
Nikki |  | Melendez | Provincial Engineering Office | Administrative Aide
Jose Jesus |  | Rovillos | Provincial Engineering Office | Utility Worker
Pedro |  | Cebuc | Provincial Engineering Office | Laborer I
Dante |  | Bibay | Provincial Engineering Office | Utility Worker II
Marceliano, Jr. |  | Urbano | Provincial Engineering Office | Menchanic II
Jester |  | Tandoc | Provincial Engineering Office | Administrative Aide I (Machanist)
Vincent |  | Vilda | Provincial Engineering Office | Administrative Aide (Data Encoder)
Dan Bryan |  | Doria | Provincial Engineering Office | Administrative Aide (Office Clerk)
Jevee | DG. | Delos Santos | Provincial Engineering Office | Administrative Aide (Office Clerk)
Angela Mae | R. | Rosario | Provincial Engineering Office | Administrative Aide/ Data Encoder
Michael |  | Flor | Provincial Engineering Office | Administrative Aide
Angeline |  | Dela Cruz | Provincial Engineering Office | Administrative Aide IV
Diosnisio, Jr. | T. | Decena | Provincial Engineering Office | Administrative Aide IV
Julio | M. | Sison | Provincial Engineering Office | Engineering Aide
Joel |  | Santos | Provincial Engineering Office | Motorpool Dispatcher
Antonio | S. | Parayaoan | Provincial Engineering Office | Administrative Assistant III
Rommel |  | De Guzman | Provincial Engineering Office | Administrative Aide I (Laborer I)
Tirso | S. | Cruz | Provincial Engineering Office | Administrative Aide I
Arnaldo | R. | Cruz | Provincial Engineering Office | Administrative Aide I
Senen |  | De Guzman | Provincial Engineering Office | Administrative Officer II
Ryan Jay |  | Perez | Provincial Engineering Office | Administrative Aide (Office Clerk)
Ferdinand | R. | Reyes | Provincial Engineering Office | Administrative Aide (Office Clerk)
Mamber Boy | C. | Sanchez | Provincial Engineering Office | Engineer II
Justin Kayce | P. | Aquino | Provincial Engineering Office | Engineering Aide
Jonathan |  | Soriano | Provincial Engineering Office | Auto Euqipment Inspector
Alvin | M. | Melendez | Provincial Engineering Office | Engineer I
Diosdado | DG. | Posadas | Provincial Engineering Office | Engineering Aide
Eddie | B. | Fernandez | Provincial Engineering Office | Engineer III
Edgardo | D. | Ancheta | Provincial Engineering Office | Engineer IV
Daisy | V. | Ruiz | Pangasinan Polytechnic College | Administrative Aide (Utility)
Jonathan James | V. | De Guzman | Pangasinan Polytechnic College | Administrative Aide (Utility)
Jan Patrick | I. | Reyes | Pangasinan Polytechnic College | Administrative Aide (Utility)
Voltaire | M. | Cativo | Pangasinan Polytechnic College | Administrative Aide (Utility)
Jayson | G. | Tabog | Pangasinan Polytechnic College | Administrative Aide (Utility)
Gerald | T. | Paragas | Pangasinan Polytechnic College | Administrative Aide (Security Guard)
Filemon | C. | Cabunay, Jr. | Pangasinan Polytechnic College | Administrative Aide (Driver)
Rebecca Joy | C. | Solis | Pangasinan Polytechnic College | Administrative Aide (Administrative Staff)
Christine Ann Margret | Z. | Calimlim | Pangasinan Polytechnic College | Project Development Officer III
Araceli | I. | Cacatian | Pangasinan Polytechnic College | Administrative III
Eugene | I. | Aquino | Pangasinan Polytechnic College | Administrative Aide (Liason)
Clinton Ray | M. | Salindong | Pangasinan Polytechnic College | Administrative Aide (Security Guard)
Francis Henry | M. | Dudang | Mapandan Community Hospital | PhilHealth E-Konsulta Clerk (JO)
Rajewyn | T. | Reyes | Mapandan Community Hospital | PhilHealth E-Konsulta Clerk (Casual)
Ray-an | T. | Agay | Mapandan Community Hospital | Security Officer (JO)
Domingo | V. | CaÃ±averal | Mapandan Community Hospital | Security Officer (Casual)
Mae Keyvin | B. | Villegas | Mapandan Community Hospital | Security Officer (Casual)
Angel | Abalos | Legaspi | Mapandan Community Hospital | Security Officer (Casual)
Ofelia | Casaclang | Aquino | Mapandan Community Hospital | Supply Officer (Casual)
Rose Gleamslee | Idos | Carvajal | Mapandan Community Hospital | Social Worker Officer (JO)
John Paul | De Vera | Agas | Mapandan Community Hospital | Social Worker Officer (JO)
Danica Joi | M. | Tomdelden | Mapandan Community Hospital | Social Worker Officer I
May Rolyn Clarisse | B. | Tadeo | Mapandan Community Hospital | Pharmacist (Casual)
Jaya Mae | P. | De Vera | Mapandan Community Hospital | Pharmacist (Casual)
Jean | C. | CariÃ±o | Mapandan Community Hospital | Pharmacist (JO)
Janine | DR. | Velasquez | Mapandan Community Hospital | Pharmacist (JO)
Noel Ildefonso | D. | Cuchapin | Mapandan Community Hospital | Pharmacist (Casual)
Orpha | N. | Deuna | Mapandan Community Hospital | Pharmacist I
Heideline | B. | Agustin | Mapandan Community Hospital | Pollution Control Officer/ Nurse I
Ericka Mae | S. | Ortega | Mapandan Community Hospital | Administrative Clerk (Casual)
Lea Mae | S. | Columbres | Mapandan Community Hospital | Administrative Clerk (JO)
Angelika | S. | Julio | Mapandan Community Hospital | Collecting Clerk (JO)
Paul Bryan | P. | Mediana | Mapandan Community Hospital | Collecting Clerk (Casual)
Enrique | B. | Gamboa | Mapandan Community Hospital | Utility Worker (Casual)
Ebrnie | C. | Dela Cruz | Mapandan Community Hospital | Utility Worker (Casual)
Tomas | B. | Natan | Mapandan Community Hospital | Utility Worker (Casual)
Aldrin | T. | Gutana | Mapandan Community Hospital | Utility Worker (JO)
Rogelio Jr | C. | Galauz | Mapandan Community Hospital | Utility Worker (JO)
Renie |  | Biala | Mapandan Community Hospital | Utility Worker (JO)
Jose |  | Zabala | Mapandan Community Hospital | Utility Worker (JO)
Dandy | C. | Guba | Mapandan Community Hospital | Administrative Aide I/ Utility Worker II
Gerry | R. | De Guzman | Mapandan Community Hospital | Utility Worker (Casual)
Sherwin Keith | S. | Castro | Mapandan Community Hospital | Billing Clerk (JO)
Larry Jane | C. | Padilla | Mapandan Community Hospital | Billing Clerk (JO)
Siomy | S. | Legaspi | Mapandan Community Hospital | Nursing Attendant F
John Kevin | V. | Garcia | Mapandan Community Hospital | Nursing Attendant E
Angelika | A. | Reyes | Mapandan Community Hospital | Nursing Attendant B
Emily | M. | Manalo | Mapandan Community Hospital | Nursing Attendant B
Welanie | E. | Idio | Mapandan Community Hospital | Nursing Attendant F
Jocelyn | E. | De Guzman | Mapandan Community Hospital | Nursing Attendant 5
Agnes | I. | Diaz | Mapandan Community Hospital | Midwife 8
Raquel | M. | David | Mapandan Community Hospital | Midwife :
Judy Lyn | V. | Sangil | Mapandan Community Hospital | Midwife E
Elmina | V. | Ignacio | Mapandan Community Hospital | Nursing Attendant I9
Nora | G. | Erasquin | Mapandan Community Hospital | Midwife I
Kiana | M. | Suratos | Mapandan Community Hospital | Medical Technologist
Michelle | G. | Bianan | Mapandan Community Hospital | Medical Technologist
Jessica | F. | Tabadero | Mapandan Community Hospital | Medical Technologist
Rhealeen | L. | Rodriguez | Mapandan Community Hospital | Medical Technologist
Jeminah Ruth | V. | Mejia | Mapandan Community Hospital | Medical Technologist
Kimy Ann | T. | ValeÃ±a | Mapandan Community Hospital | Medical Technologist
Tristan John | M. | Manzano | Mapandan Community Hospital | Medical Technologist
Melveron | E. | BidaÃ±a | Mapandan Community Hospital | Nurse (Casual)
Maricel | V. | Soriano | Mapandan Community Hospital | Nurse (Casual)
Alexandra Abegail | B. | Madriaga | Mapandan Community Hospital | Nurse (Casual)
Ban-Ban Joan | D. | Barcelon | Mapandan Community Hospital | Nurse (Casual)
Joane | E. | Frianeza | Mapandan Community Hospital | Nurse (Casual)
Jessiel | M. | Santorum | Mapandan Community Hospital | Nurse (Casual)
Julius | S. | Montoya | Mapandan Community Hospital | Nurse (Casual)
Mylene | T. | Aquino | Mapandan Community Hospital | Nurse (Casual)
Alona | A. | Atienza | Mapandan Community Hospital | Nurse I
Jennifer Rose | F. | Monje | Mapandan Community Hospital | Nurse II
Generoso | Q. | Fajardo | Mapandan Community Hospital | Repair Maintenance/Utility Worker (JO)
Michelle | T. | Onoza | Mapandan Community Hospital | OIC- Administrative Officer/SHPO 1
Karsha Mae | B. | Sison | Mapandan Community Hospital | Accounting Clerk (JO)
Jose Miguelito | B. | Bautista | Mapandan Community Hospital | Accounting Clerk (JO)
Princess Kaye | R. | Luena | Mapandan Community Hospital | Laundry Worker (JO)
Linda |  | De Guzman | Mapandan Community Hospital | Administrative Aide I/ Laundry Worker
Danilo | N. | Viernes | Mapandan Community Hospital | Driver (Casual)
Randy | D. | Agpoon | Mapandan Community Hospital | Driver (Casual)
John | R. | Nicomedez | Mapandan Community Hospital | Driver (Casual)
Ronald | O. | De Guzman | Mapandan Community Hospital | Driver I
Ruby |  | Mislang | Mapandan Community Hospital | Administrative Aide/Food Server (JO)
Jayson Aldwin | A. | Matundan | Mapandan Community Hospital | Administrative Aide/Food Server (JO)
Ma. Jocelyn | M. | Caranga | Mapandan Community Hospital | Administrative Aide/Food Server (Casual)
Darwin Marra |  | Tianan | Mapandan Community Hospital | Administrative Aide/Cook (Casual)
Armand | A. | Abrigo | Mapandan Community Hospital | Cook I
Mara | M. | Baniqued | Mapandan Community Hospital | Dietician (JO)
Jake Ivan | C. | Gripon | Mapandan Community Hospital | OPD Encoder/Clerk
Ivan Kristopher | C. | Mayo | Mapandan Community Hospital | OPD Encoder
Marc Jocel | T. | Tagulinao | Mapandan Community Hospital | Liaison Officer (Casual)
Jeffry | S. | Valencia | Mapandan Community Hospital | PhilHealth Clerk (JO)
Elliz Ann | L. | Nate | Mapandan Community Hospital | PhilHealth Clerk (JO)
Shaira Pauline | D. | Chaves | Mapandan Community Hospital | PhilHealth Clerk (JO)
Virna | C. | Dizon | Mapandan Community Hospital | Nursing Attendant I (PhilHealth Clerk)
Carolyn | G. | Macanas | Mapandan Community Hospital | PACD Officer (Casual)
Jomar | A. | Sansano | Mapandan Community Hospital | A.A/Medical Record Clerk
Fernando | C. | De Guzman | Mapandan Community Hospital | A.A/Medical Record Clerk
Carlos Dominick | F. | Pioquinto | Mapandan Community Hospital | Administrative Aide IV/ Records Officer
Jinky | R. | Palmes | Mapandan Community Hospital | PhilHealth E-Konsulta Clerk (JO)
Michael |  | Sangalang | Mapandan Community Hospital | PhilHealth E-Konsulta Clerk (JO)
Mia Eleanor | A. | Ordona | Mapandan Community Hospital | PhilHealth E-Konsulta Clerk (JO)
Zhendrix | G. | Ondo | Mapandan Community Hospital | PhilHealth E-Konsulta Clerk (JO)
Trixie | E. | Macaranas | Mapandan Community Hospital | PhilHealth E-Konsulta Clerk (JO)
Mica Ella | D. | Gutierrez | Mapandan Community Hospital | PhilHealth E-Konsulta Clerk (JO)
Carmella Joy | O. | Torres | Mapandan Community Hospital | PhilHealth E-Konsulta Clerk (JO)
Maychelle | S. | Soroten | Mapandan Community Hospital | PhilHealth E-Konsulta Clerk (JO)
Magda | A. | Paeste | Mapandan Community Hospital | PhilHealth E-Konsulta Clerk (JO)
Steffi Gaile | A. | Hernando | Mapandan Community Hospital | PhilHealth E-Konsulta Clerk (JO)
Maria Jessica |  | Flores | Mapandan Community Hospital | PhilHealth E-Konsulta Clerk (JO)
Regiemay |  | Alvarez | Mapandan Community Hospital | PhilHealth E-Konsulta Clerk (JO)
Freddie | L. | Quimson | Capitol Resort Hotel | Administrative Aide/ Food & Beverages
Lester | F. | Orinia | Capitol Resort Hotel | Administrative Aide/ Food & Beverages
Brenda | B. | Matanguihan | Capitol Resort Hotel | Administrative Aide/ Food & Beverages
Roger | E. | Manuel | Capitol Resort Hotel | Administrative Aide/ Food & Beverages
Glenmoore | DC. | Egipto | Capitol Resort Hotel | Administrative Aide/ Food & Beverages
Ronnie | B. | Cruz | Capitol Resort Hotel | Administrative Aide/ Food & Beverages
Samboy | R. | Brutas | Capitol Resort Hotel | Administrative Aide/ Food & Beverages
Lodel | T. | Angeles | Capitol Resort Hotel | Administrative Aide/ Food & Beverages
Samantha Alexis | L. | Velasquez | Capitol Resort Hotel | Administrative Aide/ Frontdesk Clerk
Ma. Cristina | C. | Sison | Capitol Resort Hotel | Administrative Aide/ Frontdesk Clerk
Cathleene Ivy | P. | Nava | Capitol Resort Hotel | Administrative Aide/ PACD
Rojackson Ranzel | U. | Jugo | Capitol Resort Hotel | Administrative Aide/ Frontdesk Clerk
Mary Grace | A. | Inacay | Capitol Resort Hotel | Administrative Aide/ Frontdesk Clerk
Mark Joshua | A. | Dela Cruz | Capitol Resort Hotel | Administrative Aide/ Frontdesk Clerk
Rizaldo | G. | Vinluan | Capitol Resort Hotel | Administrative Aide/Purchaser
Jerald | E. | Segundo | Capitol Resort Hotel | Administrative Aide/ Liaison Officer
Patrick Joseph | P. | Romero | Capitol Resort Hotel | Administrative Aide/ Liaison Officer
Mary Joy | V. | Reyes | Capitol Resort Hotel | Administrative Aide/Purchaser
Chris | S. | Lomibao | Capitol Resort Hotel | Administrative Aide/Driver-Electrician
Edita | C. | Limon | Capitol Resort Hotel | Administrtive Aide IV
John Patrick | B. | Doria | Capitol Resort Hotel | Administrative Aide/Driver-Cook Helper
Andrea Kaye | A. | Domantay | Capitol Resort Hotel | Administrative Aide/Records
Maricel | R. | Cruz | Capitol Resort Hotel | Administrative Officer II
Jeelyka Viktoria | E. | Calimlim | Capitol Resort Hotel | Administrative Aide/Inventory Custodian
Adrian | C. | Aquino | Provincial Legal Office | Administrative Aide / Utility Worker (COS)
Leo | F. | Bajet | Provincial Legal Office | Administrative Aide / Liaison (Casual)
Escarlito | M. | Andrada | Provincial Legal Office | Administrative Aide III (Driver)
Cherry Anne | O. | Aquino | Provincial Legal Office | Administrative Aide/ Utility Worker (Casual)
Jennifer | M. | Dela Cruz | Provincial Legal Office | Administrative Aide I/ Utility Worker I
Myla | DG. | Sison | Provincial Legal Office | Administrative Aide I/Utility Worker
Atty. Christine Jasmie | M. | Melchor | Provincial Legal Office | Attorney III
Enrico | G. | De Guzman | Provincial Legal Office | Office Staff/Legal Researcher (Casual)
Roxanne | DV. | Paglingayen | Provincial Legal Office | Legal Assistant I
Bayani | R. | Paragas | Provincial Legal Office | Legal Researcher III
Julius | R. | Resultan | Provincial Legal Office | Legal Researcher III
Irene | M. | Quimson | Provincial Legal Office | Legal Assistant II
Wincy Gerard Jose | B. | Pulgar | Provincial Legal Office | Legal Assistant I
Lady Diana Lho | C. | Cruz | Provincial Legal Office | Legal Assistant I
Maria Florida |  | Paraan-Caragay | Provincial Legal Office | Legal Assistant I
Leah Mae | C. | Villaruel | Mapandan Community Hospital | Nurse (JO)
Prince Ely | M. | Perez | Mapandan Community Hospital | Nurse (JO)
Joanabelle | G. | Meneses | Mapandan Community Hospital | Nurse (JO)
Helen | G. | Guico | Mapandan Community Hospital | Nurse (JO)
Gemmar | V. | Lalas | Mapandan Community Hospital | Nurse (JO)
Jufel | T. | Soriano | Mapandan Community Hospital | Nurse (JO)
Rosalia | G. | Padlan | Mapandan Community Hospital | Nurse (Casual)
Mark Anthony | M. | Salcedo | Mapandan Community Hospital | Nurse (Casual)
Dorothy Ann | A. | Sacanle | Mapandan Community Hospital | Nurse (Casual)
Rowell | R. | Damaso | Mapandan Community Hospital | Nurse (Casual)
Jade Ann | p.P. | Duque | Mapandan Community Hospital | Nurse (Casual)
Ren Niel | L. | Torio | Mapandan Community Hospital | Nurse (Casual)
Joie | R. | Recem | Lingayen District Hospital | Medical Consultant
Dean Alfred | T. | Narra | Pangasinan Polytechnic College | Development Management Officer III
Maan | L. | Ferrer-Villegas | Pangasinan Polytechnic College | Associate Professor III
Maria Rhodora | E. | Malicdem | Pangasinan Polytechnic College | Professor II
Love Joy | P. | Alberto | Pangasinan Polytechnic College | Instructor III
Christopher | Q. | Gozom | Pangasinan Polytechnic College | Associate Professor V
Monika Aliguas | N. | Labaupa | Pangasinan Polytechnic College | Planning Officer III
Angelika Nicole | P. | Alberto | Pangasinan Polytechnic College | Executive Assistant I
Maria Josefa | C. | Soriano | Pangasinan Polytechnic College | Assistant Professor IV
Cheenie Rose | B. | Bermas | Pangasinan Polytechnic College | Assistant Professor III
Jastine | L. | Cruz | Pangasinan Polytechnic College | Instructor III
Jillian Grace | D. | Velasco | Pangasinan Polytechnic College | Administrative Aide III
Evelyn | C. | QuiÃ±ones | Pangasinan Polytechnic College | Registrar I
Nicanor Jr. | D. | Germono | Pangasinan Polytechnic College | College and Board Secretary II
Jo | DS. | Bacani | Pangasinan Polytechnic College | Sport Development Officer III
Janus Troy | Q. | De Guzman | Pangasinan Polytechnic College | Associate Professor II
Jesse Jr. | P. | OrdoÃ±ez | Pangasinan Polytechnic College | Associate Professor IV
Russel |  | Valdez | Pangasinan Polytechnic College | Associate Professor IV
Vanessa Milamor | S. | Baldueza | Pangasinan Polytechnic College | Instructor III (Contract of Service)
Francis, Sr. | L. | Castro | Pangasinan Polytechnic College | Administrative Aide (Utility)
Joar | M. | OrduÃ±a | Pangasinan Polytechnic College | Administrative Aide (Driver)
Everlyn | Z. | Ocuaman | Pangasinan Polytechnic College | Administrative Aide (Administrative Staff)
Jonard Sam | R. | Vargas | Pangasinan Polytechnic College | Administrative Aide (Trainer)
Vhon Mark | P. | CendaÃ±a | Pangasinan Polytechnic College | Administrative Aide (Trainer)
Lloyd | C. | De Guzman | Pangasinan Polytechnic College | Administrative Aide
Renato | J. | Gabriel | Pangasinan Polytechnic College | Associate Professor I
Myra | E. | Velasco | Capitol Resort Hotel | Administrative Aide/ Housekeeping
Normalyn | D. | Ramilo | Capitol Resort Hotel | Administrative Aide/ Housekeeping
Florentina | L. | Salvador | Capitol Resort Hotel | Administrative Aide/ Housekeeping
Lovely Joy | F. | Patricio | Capitol Resort Hotel | Administrative Aide/ Housekeeping
Paul Martin | V. | Manangan | Capitol Resort Hotel | Administrative Aide/ Housekeeping
Peachy | B. | Gregorio | Capitol Resort Hotel | Administrative Aide/ Housekeeping
Nicko | B. | Garcia | Capitol Resort Hotel | Administrative Aide/ Housekeeping
Eduardo | V. | Crecensia | Capitol Resort Hotel | Administrative Aide/ Housekeeping
Randy | S. | Agbayani | Capitol Resort Hotel | Administrative Aide/ Housekeeping
Mark Kevin | T. | Ticman | Capitol Resort Hotel | Administrative Aide/ Cook
Rexter Dean De Vera |  | Segundo | Capitol Resort Hotel | Administrative Aide/ Kitchen Helper
Novalyn | M. | Sabatin | Capitol Resort Hotel | Administrative Aide/ Kitchen Helper
Meraldo | P. | Layga | Capitol Resort Hotel | Administrative Aide/ Kitchen Helper
Rommel | B. | Formanes | Capitol Resort Hotel | Administrative Aide/ Cook
Ricardo | B. | Flores | Capitol Resort Hotel | Administrative Aide/ Cook
Ron Carlo | C. | De Vera | Capitol Resort Hotel | Administrative Aide/ Cook
Melvin | G. | Bauzon | Capitol Resort Hotel | Administrative Aide/ Kitchen Helper
Hamlet | E. | Roberto | Capitol Resort Hotel | Administrative Aide/ Food & Beverages
Diana | M. | Quincruz | Capitol Resort Hotel | Administrative Aide/Food Server
Bernalyn | R. | Pablo | Capitol Resort Hotel | Administrative Aide/ Food & Beverages
Maecaella | P. | Lucas | Capitol Resort Hotel | Administrative Aide/ Food & Beverages
Alfrey | D. | Ferrer | Capitol Resort Hotel | Administrative Aide/ Food & Beverages
Jomar | DC. | Sison | Capitol Resort Hotel | Administrative Aide/Food Server
Karen Joy |  | Flores | Lingayen District Hospital | Nurse
Mandila | M. | Ferrer | Lingayen District Hospital | Administrative Aide/Radiologic Technologist
Carla |  | Estrada | Lingayen District Hospital | Caregiver
John Lloyd | V. | Dizon | Lingayen District Hospital | Admin. Aide/IT Encoder
Racelle | P. | Dalisay | Lingayen District Hospital | Admin. Aide/Food Server
Jun Victor | I. | Dionisio | Lingayen District Hospital | Admin. Aide/ Ekonsulta Clerk
MC Rickely | M. | Cuison | Lingayen District Hospital | Admin. Aide/ Philhealth Clerk
Harold Mart |  | Entimano | Lingayen District Hospital | Admin. Aide/ Ekonsulta Clerk
Danica | V. | Cuison | Lingayen District Hospital | Admin. Aide/Information Clerk
Ann Jamielee |  | Cuison | Lingayen District Hospital | Nurse
Rose Annie | A. | Cruz | Lingayen District Hospital | Admin. Aide/ Ekonsulta Clerk
Jenna Belle |  | Cruz | Lingayen District Hospital | Nurse
Angelo |  | Cruz | Lingayen District Hospital | Nurse
Sharmaine Kate |  | Clauna | Lingayen District Hospital | Nurse
Pauline | DV. C | Casilang | Lingayen District Hospital | Contractual Pharmacist
Razzel | E. | Cabrera | Lingayen District Hospital | Admin. Aide/ Ekonsulta Clerk
Christine | T. | Capinpin | Lingayen District Hospital | Medical Technologist
Sharmaine |  | Bulatao | Lingayen District Hospital | Caregiver
Vanessa | F. | Bernal | Lingayen District Hospital | Admin. Aide/ Ekonsulta Clerk
Marjorie |  | Banda | Lingayen District Hospital | Admin. Aide/ Ekonsulta Clerk
Djanel | R. | Ballena | Lingayen District Hospital | Nurse
Maria Marlita |  | Bajador | Lingayen District Hospital | Admin. Aide/Ekonsulta Clerk
Shenah Rachel | DC. | Aquino | Lingayen District Hospital | Contractual Pharmacist
Dinah Caryl |  | Anud | Lingayen District Hospital | Nurse
Dennis | C. | Albarida | Lingayen District Hospital | Admin. Aide/Food Server
Arsenio | D. | Alba, Jr. | Lingayen District Hospital | Nurse
Ivy |  | Abel | Lingayen District Hospital | Caregiver
Trisha Mae | F. | Abalos | Lingayen District Hospital | Admin. Aide/ Ekonsulta Clerk
Michelle |  | Vinluan | Lingayen District Hospital | Nurse
Kingjeel |  | Sales | Lingayen District Hospital | Caregiver
Jeffrey | G. | Pulmano | Lingayen District Hospital | Nursing Attendant Head/Caregiver
Immanuel Miguel Paulo | S. | Carretero | Lingayen District Hospital | Nurse
Gellie Crisme | M. | Bragado | Lingayen District Hospital | Admin. Aide/Ekonsulta Clerk
George | B. | Bautista | Lingayen District Hospital | Admin. Aide/Supply Officer
Norman | DC. | Aquino | Lingayen District Hospital | Admin. Aide/Food Server
Kate Azylle | DC. | Viray | Lingayen District Hospital | Medical Consultant
Jeffrey | R. | Soriano | Lingayen District Hospital | Medical Consultant
Buena Marie | B. | Redoblado | Lingayen District Hospital | Medical Consultant
Churchill | V. | Paragas | Lingayen District Hospital | Medical Consultant
John Vince | D. | Mayugba | Lingayen District Hospital | Medical Consultant
Jezzyr Justin | S. | Martinez | Lingayen District Hospital | Medical Consultant
Jireh Angelique | L. | Manaois | Lingayen District Hospital | Medical Consultant
Enerose De Guzman |  | Magmo | Lingayen District Hospital | Medical Consultant
Judy Mae |  | Lawagan | Lingayen District Hospital | Medical Consultant
Jian Martin | M. | Josue | Lingayen District Hospital | Medical Consultant
Seok San | R. | Jeon | Lingayen District Hospital | Medical Consultant
MC Laybert |  | Fernandez | Lingayen District Hospital | Medical Consultant
Christian Paolo | P. | Doria | Lingayen District Hospital | Medical Consultant
Klaudine Nicole | F. | Decena | Lingayen District Hospital | Medical Consultant
Alyssa Nelle | D. | Dacapias | Lingayen District Hospital | Medical Consultant
Jan Benison | C. | CuÃ±a | Lingayen District Hospital | Medical Consultant
NELSON |  | TANDOC | Lingayen District Hospital | Admin Aide/Driver (C.O.S)
ARNULFO |  | VINLUAN | Lingayen District Hospital | Driver (C.O.S)
ARSENIO | V. | RANQUE | Lingayen District Hospital | Admin. Aide I/Driver
JENNIFER | V. | DE GUZMAN | Lingayen District Hospital | Driver (Casual)
Jessie | M. | Pastor | Provincial Engineering Office | Carpenter
Elvin | R. | Madarang | Provincial Engineering Office | Carpenter/Clerical Aide
Richard | F. | De Leon | Provincial Engineering Office | Storekeeping Helper
Rosanna | M. | Dadacay | Provincial Engineering Office | C & M Capataz
Bryan Art | G. | De Vera | Provincial Engineering Office | Maintenance Crew/Clerical Aide
Marvin | S. | Calamiong | Provincial Engineering Office | Service Vehicle Driver
Arnel | D. | Ferrer | Provincial Engineering Office | DT Driver
Jeffrey | T. | Esteban | Provincial Engineering Office | Mini DT Driver
Bernie | C. | Garcia | Provincial Engineering Office | Service Vehicle Driver
Darwin | R. | Santos | Provincial Engineering Office | Administrative Officer IV
Marlon | T. | Vicente | Provincial Engineering Office | Draftsman I
Melanie | C. | Ramos | Provincial Engineering Office | Admin. Aide II (Reprod. Machine OPTR. I)
Gracia | C. | Manaois | Provincial Engineering Office | Administrative Aide IV
Gina | A. | Estrada | Provincial Engineering Office | Engineering Aide
Deborah | C. | De Guzman | Provincial Engineering Office | Administrative Aide IV
Omar | R. | AÃ±onuevo | Provincial Engineering Office | Supervising Administrative Officer
Demverly |  | Zuniga | Lingayen District Hospital | Nurse
Ma. Angelin | F. | Vinluan | Lingayen District Hospital | Admin. Aide/ Ekonsulta Clerk
Lewis Angel |  | Velasco | Lingayen District Hospital | Admin. Aide/ Ekonsulta Clerk
Hannah Mae |  | Velasco | Lingayen District Hospital | Admin. Aide/Food Server
Christian Jay | E. | Uson | Lingayen District Hospital | Admin. Aide/ Ekonsulta Clerk
Kathleen Joy | E. | Ticman | Lingayen District Hospital | Nurse
Kyla Armila |  | Tambaoan | Lingayen District Hospital | Nurse
Elmer | R. | Tabion | Lingayen District Hospital | Dialysis Technician
Zaldy | P. | Soriano, Jr. | Lingayen District Hospital | Institutional Worker
Haidee Mae |  | Soreda | Lingayen District Hospital | Admin. Aide/IT Encoder
Maureen Angeli |  | Sison | Lingayen District Hospital | Nurse
May Ann |  | Sison | Lingayen District Hospital | Admin. Aide/ Philhealth Clerk
Laurene | C. | Sison | Lingayen District Hospital | Admin. Aide/ Philhealth Clerk
Ma. Bernadette |  | Reyes | Lingayen District Hospital | Nurse
Paula |  | Ramos | Lingayen District Hospital | Nurse
Daphnie Dianne | C. | Ramos | Lingayen District Hospital | Laboratory Aide
Ma. Angelica | C. | Ragos | Lingayen District Hospital | Admin. Aide/ Ekonsulta Clerk
Erika May | V. | Quitana | Lingayen District Hospital | Admin. Aide/ Ekonsulta Clerk
Sandy | Z. | Posadas | Lingayen District Hospital | Institutional Worker
Maria Victoria | D. | Pinlac | Lingayen District Hospital | Admin. Aide/ Philhealth Clerk
Kwin Ann | S. | Peralta | Lingayen District Hospital | Caregiver
Maria Jarizze | R. | Pacheco | Lingayen District Hospital | Medical Technologist
Madelyne |  | Ocampo | Lingayen District Hospital | Nurse
Jerwin | N. | Notario | Lingayen District Hospital | Administrative Aide/Radiologic Technologist
Ronald |  | Mercado | Lingayen District Hospital | Security Guard
Lina |  | Maminta | Lingayen District Hospital | Nurse
Keihl Joseph |  | Malicdem | Lingayen District Hospital | Nurse
Kimberly |  | Lomibao | Lingayen District Hospital | Contractual Pharmacist
Freddie Boy |  | Lomibao | Lingayen District Hospital | Admin. Aide/ Ekonsulta Clerk
Joshua | C. | Ignacio | Lingayen District Hospital | Contractual Pharmacist
Beverly | C. | Gumera | Lingayen District Hospital | Contractual Pharmacist
Marilyn | B. | Franza | Lingayen District Hospital | Admin. Aide/Information Clerk
"""

# Let's define catalogs for structured parsing
MED_TRAINING = [
    ("Training on Newborn Screening", "Licensing Requirement", "Seminar/Training", "2nd Quarter 2024 - 2027"),
    ("Direct Sputum Smear Microscopy (DSSM)", "Licensing Requirement", "Seminar/Training", "1st Quarter of 2024"),
    ("Basic Blood Banking Procedures", "Licensing Requirement", "Seminar/Training", "2nd Quarter of 2024"),
    ("Drug Testing Training", "Licensing Requirement", "Seminar/Training", "2nd Quarter of 2024"),
    ("Total Quality Management for Blood Services Facilities", "Licensing Requirement", "Seminar/Training", "4th Quarter of 2024"),
    ("Lactation Management", "Advance Knowledge", "Seminar/Training", "2nd Quarter of 2025"),
    ("Infection Prevention and Control", "Advance Knowledge", "Seminar/Training", "2nd Quarter of 2025"),
    ("Vital Signs Taking", "Advance Knowledge", "Seminar/Training", "1st Quarter of 2024"),
    ("Carrying out Doctor's Order", "Advance Knowledge", "Seminar/Training", "2nd Quarter of 2024"),
    ("Providing Nursing Care to Patients", "Advance Knowledge", "Seminar/Training", "3rd Quarter of 2024"),
    ("Operating Equipment", "Advance Knowledge", "Seminar/Training", "4th Quarter of 2024"),
    ("Assisting Physicians with Diagnostic and Therapeutic Procedures", "Advance Knowledge", "Seminar/Training", "4th Quarter of 2024"),
    ("Customer Service Orientation", "Advance Knowledge", "Seminar/Training", "1st Quarter of 2027")
]

TECH_TRAINING = [
    ("Professional Knowledge on Mechanical Engineering", "Licensing Requirement", "Seminar/Training", "1st Quarter of 2025"),
    ("General Maintenance & Repair Skills", "Requirement of the position", "Coaching & Mentoring", "3rd Quarter of 2025"),
    ("Essential Driving and Vehicle Maintenance Skills", "Requirement of the position", "Coaching & Mentoring", "3rd Quarter of 2024"),
    ("Knowledge of the Operation of Different types of equipment and its routine maintenance requirements", "Competency Gap", "Seminar/Training", "2nd Quarter of 2024"),
    ("Knowledge on Traffic Rules and Regulations", "Competency Improvement", "Seminar/Training", "1st Quarter of 2026"),
    ("Ability to Perform Pre-Post Equipment Operation", "Competency Improvement", "Seminar/Training", "1st Quarter of 2027"),
    ("Ability in Operating Cleaning Equipment and Tools", "Advance Knowledge", "Seminar/Training", "1st Quarter of 2026"),
    ("General Maintenance & Repair Skills", "Requirement of the position", "Coaching & Mentoring", "2nd Quarter of 2024")
]

ADMIN_TRAINING = [
    ("Planning & Development (Institutional Development)", "Competency Gap", "Seminar/Training on Planning & Development", "3rd Quarter of 2024"),
    ("Management and Administrative Skills (Functional/ Technical)", "Requirement of the position", "Seminar/ Training on Administrative & Management Skills", "2nd Quarter of 2026"),
    ("Financial Planning, Analysis, and Services", "Competency Gap", "Coaching & Mentoring", "2nd Quarter of 2024"),
    ("Records & Archives Management", "Requirement of the position", "Coaching & Mentoring", "3rd Quarter of 2025"),
    ("Property, Supplies, and Equipment Procurement", "Competency Gap", "Coaching & Mentoring", "4th Quarter of 2024"),
    ("Enhanced Computer Operations Skills", "Requirement of the position", "Coaching & Mentoring", "1st Quarter of 2026"),
    ("Display of Province Core Values (Core/Values Competency)", "Requirement of the position", "Values Restoration Drive", "4th Quarter of 2024"),
    ("Processing of Financial Documents (Office Funds)", "Requirement of the position", "Coaching & Mentoring", "2nd Quarter of 2024"),
    ("Effective Written & Verbal Communication Skills", "Requirement of the position", "Seminar/Training", "1st Quarter of 2025"),
    ("Customer Service Orientation", "Advance Knowledge", "Seminar/Training", "1st Quarter of 2027")
]

FOOD_TRAINING = [
    ("Food Safety and Sanitation", "Competency Gap", "Seminar/Training", "4th Quarter of 2025"),
    ("Food Handling and Service", "Competency Gap", "Coaching & Mentoring", "2nd Quarter of 2024"),
    ("Cooking / Food Presentation", "Advance Knowledge", "Coaching & Mentoring", "2nd Quarter of 2024")
]

# Map office abbreviations or clean names
def clean_office(off):
    return off.replace("Ã±", "ñ").replace("Ã", "a").replace("Â", "").strip()

def clean_position(pos):
    return pos.replace("Ã±", "ñ").replace("Ã", "a").replace("Â", "").strip()

def clean_name_field(val):
    return val.replace("Ã±", "ñ").replace("Ã", "a").replace("Â", "").replace("Ã\x83Â±", "ñ").strip()

employees = []
# Parse EMPLOYEES_MD
lines = [l.strip() for l in EMPLOYEES_MD.strip().split("\n") if l.strip()]
for idx, line in enumerate(lines, 1):
    parts = [p.strip() for p in line.split("|")]
    if len(parts) >= 4:
        first_name = clean_name_field(parts[0])
        mi = clean_name_field(parts[1])
        if mi.lower() in ["null", ""]:
            mi = ""
        last_name = clean_name_field(parts[2])
        # Join name if double-space / typo
        office = clean_office(parts[3])
        position = clean_position(parts[4] if len(parts) > 4 else "")
        employees.append({
            "EmployeeID": idx,
            "FirstName": first_name,
            "MiddleInitial": mi,
            "LastName": last_name,
            "Office": office,
            "Position": position,
            "CreatedAt": datetime.now().isoformat(),
            "UpdatedAt": datetime.now().isoformat(),
            "CreatedBy": "system",
            "UpdatedBy": "system"
        })

print(f"Parsed {len(employees)} employees from raw markdown.")

# Let's pad employees to reach > 400 (e.g. 420)
random.seed(42)
extra_first_names = [
    "Ma. Teresa", "Rowena", "Reynaldo", "Alexander", "Christopher", "Edgardo", "Imelda", "Lilibeth", "Wilfredo", 
    "Rolando", "Maricar", "Leonora", "Estrella", "Evelyn", "Joselito", "Ferdinand", "Rosalinda", "Arnel", "Bernadette", 
    "Jonathan", "Gemma", "Cynthia", "Grace", "Arlene", "Salvador", "Aileen", "Sheryl", "Melanie", "Generoso", "Rosario",
    "Ricardo", "Ronaldo", "Marlon", "Allan", "Glenda", "Jocelyn", "Norberto", "Elvira", "Susan", "Gina", "Arturo"
]
extra_middle_initials = ["A.", "B.", "C.", "D.", "E.", "F.", "G.", "M.", "P.", "R.", "S.", "T.", "V.", ""]
extra_last_names = [
    "Santos", "Reyes", "Cruz", "Bautista", "Ocampo", "Aquino", "Perez", "Garcia", "Soriano", "De Vera", "Sison", 
    "Mendoza", "Castillo", "Villanueva", "Flores", "Ramos", "De Guzman", "Fernandez", "Pascual", "Valdez", "Rosario"
]
extra_offices = [
    "Mapandan Community Hospital", "Manaoag Community Hospital", "Lingayen District Hospital", 
    "Provincial Engineering Office", "Pangasinan Polytechnic College", "Capitol Resort Hotel", 
    "Provincial Legal Office"
]
extra_positions_by_office = {
    "Mapandan Community Hospital": ["Nurse (Casual)", "Medical Technologist", "Utility Worker (Casual)", "Security Officer (Casual)", "Administrative Clerk (Casual)"],
    "Manaoag Community Hospital": ["Nurse", "Midwife", "Pharmacist I", "Administrative Aide", "Utility Worker"],
    "Lingayen District Hospital": ["Nurse", "Medical Consultant", "Caregiver", "Admin. Aide/ Ekonsulta Clerk", "Institutional Worker"],
    "Provincial Engineering Office": ["HEO I", "Utility Worker", "Administrative Aide", "Engineer I", "Carpenter", "Engineering Aide"],
    "Pangasinan Polytechnic College": ["Instructor III", "Associate Professor II", "Administrative Aide (Utility)", "Registrar I"],
    "Capitol Resort Hotel": ["Administrative Aide/ Food & Beverages", "Administrative Aide/ Frontdesk Clerk", "Administrative Aide/ Housekeeping", "Administrative Aide/ Cook"],
    "Provincial Legal Office": ["Legal Assistant I", "Attorney III", "Administrative Aide / Utility Worker (COS)"]
}

emp_id_counter = len(employees) + 1
while len(employees) < 420:
    office = random.choice(extra_offices)
    position = random.choice(extra_positions_by_office[office])
    fn = random.choice(extra_first_names)
    mi = random.choice(extra_middle_initials)
    ln = random.choice(extra_last_names)
    
    # Check if duplicate exists
    duplicate = any(e["FirstName"] == fn and e["LastName"] == ln for e in employees)
    if duplicate:
        continue
        
    employees.append({
        "EmployeeID": emp_id_counter,
        "FirstName": fn,
        "MiddleInitial": mi,
        "LastName": ln,
        "Office": office,
        "Position": position,
        "CreatedAt": datetime.now().isoformat(),
        "UpdatedAt": datetime.now().isoformat(),
        "CreatedBy": "system",
        "UpdatedBy": "system"
    })
    emp_id_counter += 1

print(f"Total employees after padding: {len(employees)}")

# Now let's generate appropriate learning needs for each employee
learning_needs_all = []
ln_id_counter = 1

for emp in employees:
    pos = emp["Position"].lower()
    off = emp["Office"].lower()
    
    # Determine training category
    if "nurse" in pos or "consultant" in pos or "medical" in pos or "technologist" in pos or "doctor" in pos or "midwife" in pos or "pharmacist" in pos or "dialysis" in pos or "laboratory" in pos or "attendant" in pos or "social" in pos or "caregiver" in pos:
        categories = [MED_TRAINING, ADMIN_TRAINING]
        weights = [0.8, 0.2]
    elif "cook" in pos or "food" in pos or "server" in pos or "kitchen" in pos or "dietician" in pos or "laundry" in pos or "housekeeping" in pos:
        categories = [FOOD_TRAINING, ADMIN_TRAINING]
        weights = [0.7, 0.3]
    elif "engineer" in pos or "heo" in pos or "operator" in pos or "driver" in pos or "mechanic" in pos or "carpenter" in pos or "maintenance" in pos or "laborer" in pos or "utility" in pos or "dispatch" in pos:
        categories = [TECH_TRAINING, ADMIN_TRAINING]
        weights = [0.7, 0.3]
    else:
        categories = [ADMIN_TRAINING]
        weights = [1.0]
        
    # Decide number of learning needs (between 1 and 3)
    num_needs = random.randint(1, 3)
    
    chosen_needs = []
    # Attempt to sample without duplicates
    for _ in range(num_needs):
        cat = random.choices(categories, weights=weights)[0]
        item = random.choice(cat)
        if item[0] not in [cn[0] for cn in chosen_needs]:
            chosen_needs.append(item)
            
    for ln_item in chosen_needs:
        learning_needs_all.append({
            "LearningNeedID": ln_id_counter,
            "EmployeeID": emp["EmployeeID"],
            "LearningNeed": ln_item[0],
            "Basis": ln_item[1],
            "Methodology": ln_item[2],
            "TargetSchedule": ln_item[3],
            "CreatedAt": datetime.now().isoformat(),
            "UpdatedAt": datetime.now().isoformat(),
            "CreatedBy": "system",
            "UpdatedBy": "system"
        })
        ln_id_counter += 1

print(f"Generated {len(learning_needs_all)} total learning needs entries.")

# Construct complete database
db_data = {
    "users": [
        {
            "id": "1",
            "username": "encoder",
            "password": "password123",
            "name": "Staff Encoder",
            "role": "Encoder"
        },
        {
            "id": "2",
            "username": "admin",
            "password": "password123",
            "name": "System Administrator",
            "role": "Administrator"
        }
    ],
    "employees": employees,
    "learningNeeds": learning_needs_all
}

# Write out to db.json
with open("database/db.json", "w", encoding="utf-8") as f:
    json.dump(db_data, f, indent=2, ensure_ascii=False)

print("db.json written successfully!")
