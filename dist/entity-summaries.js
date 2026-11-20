import {readerField} from './reader-copy.js';
import {campaignRoster} from './campaigns-2026.js';

// Each introduction names the documents that support its specific claims.
// The full evidence record retains dates, qualifications and additional sources.
const profiles = {
  city: ['Columbus’s mayor heads the city government, and its elected council approves contracts and spending. In 2024 council authorized up to $228,000 to lease 38 license plate readers for city police.', 'mayor', 'flock-contract-2024'],
  council: ['Columbus voters elect the members of City Council. Each represents a district, and the council directory identifies which members lead the body.', 'council'],
  hardin: ['Shannon Hardin represents District 9 and serves as president of Columbus City Council. At a 2025 hearing, he questioned the timetable for changing rates for large water users.', 'council', 'city-lobbyists-2025'],
  dorans: ['Rob Dorans represents District 3 on Columbus City Council. The council lists him as president pro tem, its second leadership post.', 'council'],
  bankston: ['Nicholas Bankston represents District 5 on Columbus City Council, the elected body that votes on city ordinances and spending.', 'council'],
  county: ['The Franklin County Board of Commissioners takes part in LinkUS, the regional transportation initiative that also involves Columbus and the Central Ohio Transit Authority.', 'linkus'],
  linkus: ['LinkUS brings Columbus, Franklin County and regional partners together on transportation. The Central Ohio Transit Authority leads transit work alongside the region’s planning commission.', 'linkus'],
  cota: ['The Central Ohio Transit Authority runs public transit in the Columbus area. It led the Rickenbacker mobility center project and broke ground in 2023.', 'political-rickenbacker'],
  monica: ['Monica Téllez-Fowler leads the Central Ohio Transit Authority. As president and CEO, she represented COTA in its June 2026 announcement about LinkUS.', 'linkus'],
  morpc: ['The Mid-Ohio Regional Planning Commission works across local government boundaries on transportation planning. It joins COTA, Columbus and Franklin County in LinkUS.', 'linkus'],
  murdock: ['William Murdock leads the Mid-Ohio Regional Planning Commission. Smart Columbus also lists him on its board, connecting the regional planning agency to the civic innovation group.', 'linkus', 'smart'],
  partnership: ['Columbus business leaders Les Wexner, Jack Kessler and John F. Wolfe founded the Columbus Partnership in 2002. Its membership brings executives together on regional civic projects.', 'partnership-founders'],
  burger: ['Corrine Burger became CEO of the Columbus Partnership in September 2026. Its announcement also lists her board service at Nationwide Children’s Hospital and Columbus State Community College.', 'burger'],
  'one-columbus': ['One Columbus is a regional economic-development nonprofit. In 2025 Columbus City Council authorized a grant of up to $1.3 million, including $500,000 for the Regional Housing Coalition.', 'city-capital-2025'],
  'smart-columbus': ['Smart Columbus is a civic innovation lab within the Columbus Partnership. Its board brings together people from business, regional planning and local government.', 'smart'],
  nationwide: ['Nationwide is a Columbus insurance and financial services company. The National Women’s Soccer League names it among the partners in the Columbus franchise awarded in 2026.', 'nwsl-ownership'],
  walker: ['Nationwide CEO Kirt Walker also served as a Columbus Partnership co-chair when the group announced its new chief executive in September 2026.', 'burger'],
  huntington: ['Huntington Bancshares is the parent of The Huntington National Bank. The bank provided a revolving credit line to the JobsOhio group.', 'flow-huntington-bank', 'flow-jobs-finance'],
  steinour: ['Stephen Steinour leads Huntington Bancshares. His company biography also lists board service at Battelle and Bath & Body Works.', 'steinour'],
  aep: ['American Electric Power is an electric utility. The SEC found that it created and funded Empowering Ohio’s Economy and directed the nonprofit’s political spending.', 'aep-order'],
  battelle: ['Battelle Memorial Institute is a Columbus research organization. Smart Columbus lists it as a collaborator, and Huntington’s Stephen Steinour lists it among his board appointments.', 'smart', 'steinour'],
  medical: ['The Ohio State University Wexner Medical Center is the university’s medical center. Huntington executive Stephen Steinour lists a medical center trusteeship in his biography.', 'steinour'],
  children: ['Nationwide Children’s is a pediatric hospital in Columbus. In September 2026 the Columbus Partnership identified incoming CEO Corrine Burger as a member of the hospital’s board.', 'burger'],
  cstate: ['Columbus State Community College serves local students through the Columbus Promise, a city-led program that helps cover tuition.', 'wexner-campaigns-2026'],
  airport: ['The Columbus Regional Airport Authority oversees the regional airport system. The Columbus Partnership named its incoming CEO, Corrine Burger, as an authority board member in 2026.', 'burger'],
  lbrands: ['L Brands was the corporate name that preceded Bath & Body Works, Inc. The company changed its name in August 2021.', 'rename'],
  les: ['Les Wexner helped found the Columbus Partnership in 2002. In a 2019 letter, he said he had given Jeffrey Epstein power of attorney over his personal finances and ended the relationship in 2007.', 'partnership-founders', 'les-letter'],
  epstein: ['Jeffrey Epstein managed Les Wexner’s personal finances. He pleaded guilty in Florida in 2008 to offenses involving a minor and died before trial on federal charges brought in 2019.', 'les-letter', 'epstein-plea', 'epstein-death'],
  'generation-now': ['Generation Now was the nonprofit through which Larry Householder’s operation raised and spent money to pass Ohio House Bill 6 and defend it from repeal. The organization pleaded guilty to racketeering.', 'hb6-verdict'],
  householder: ['Larry Householder served as speaker of the Ohio House. A federal jury convicted him of racketeering conspiracy in 2023 for his role in the House Bill 6 bribery scheme.', 'hb6-verdict'],
  firstenergy: ['FirstEnergy admitted in a 2021 federal agreement that it paid millions through a nonprofit for help passing nuclear legislation in Ohio. The utility agreed to a $230 million penalty.', 'fe-admission'],
  hb6: ['Ohio lawmakers passed House Bill 6 in 2019 to provide energy subsidies. The federal case against Larry Householder traced how his organization financed efforts to pass the bill and prevent its repeal.', 'hb6-verdict'],
  sec: ['The U.S. Securities and Exchange Commission oversees securities markets and company disclosures. In 2025, American Electric Power agreed to a $19 million penalty over misleading disclosures about its political spending.', 'aep-sec'],
  'resource-fuels': ['Generation Now’s bank records show a $250,000 wire from Resource Fuels in April 2018. The transfer appears in bank exhibits from the House Bill 6 trial.', 'gn-bank'],
  'boich-donors': ['A 2017 check for $25,000 to Generation Now bears the Boich donors’ names. The bank exhibit records a single check from the named donors.', 'gn-bank'],
  'karen-trust': ['The Karen Buchwald Wright trust wired $250,000 to Generation Now in October 2018, according to the nonprofit’s bank records.', 'gn-bank'],
  'penn-national': ['The gaming company Penn National sent Generation Now $125,000 in checks between October 2017 and September 2019, according to the nonprofit’s bank records.', 'gn-bank'],
  'fair-gaming': ['This gaming advocacy group wrote a $100,000 check to Generation Now in November 2019. The check appears in the nonprofit’s bank records.', 'gn-bank'],
  'jack-entertainment': ['The gaming company JACK Entertainment sent Generation Now two checks totaling $75,000. Its first check dates to March 2018 and the second to September 2019.', 'gn-bank'],
  charter: ['Charter Communications is a telecommunications company. Generation Now’s bank records show five Charter checks totaling $125,000 between 2018 and 2020.', 'gn-bank'],
  att: ['The telecommunications company AT&T sent Generation Now four checks totaling $75,000 between April 2018 and March 2020, according to the nonprofit’s bank records.', 'gn-bank'],
  redflex: ['Redflex supplied cameras for Columbus’s red-light enforcement program. In 2016 the company agreed to pay the city $100,000 in restitution under a federal non-prosecution agreement.', 'redflex-npa'],
  raphael: ['John Raphael was a Columbus lobbyist. He pleaded guilty to extorting money from Redflex to pass along as political contributions while the company sought red-light camera contracts.', 'redflex-npa'],
  finley: ['Karen Finley ran Redflex Traffic Systems from 2005 to 2013. In 2015 she pleaded guilty in the Ohio bribery case involving the company’s red-light camera contracts.', 'redflex-plea'],
  'ohio-democrats': ['The Ohio Democratic Party gave Andrew Ginther’s City Council campaign $21,000 in 2011. WOSU traced that contribution in campaign reports while covering the Redflex case.', 'redflex-ginther'],
  'ginther-campaign': ['Andrew Ginther ran for Columbus City Council in 2011. WOSU identified a $21,000 contribution from the Ohio Democratic Party to that campaign in November of that year.', 'redflex-ginther'],
  'ginther-fund': ['This record follows contributions to Andrew Ginther’s campaign. In 2025 WOSU reported a $10,000 contribution from the Pizzuti political action committee.', 'campaign-developers-2025'],
  'hardin-fund': ['This record follows contributions to Columbus council president Shannon Hardin’s campaign. WOSU reported $5,000 contributions from both the apartment association PAC and the realtors’ PAC in 2025.', 'campaign-developers-2025'],
  'wexner-donors': ['WOSU reported that Les and Abigail Wexner together contributed more than $150,000 to Andrew Ginther’s campaign and more than $40,000 to Shannon Hardin’s from 2016 to early 2026. Those are combined amounts for the couple.', 'wexner-campaigns-2026'],
  promise: ['The Columbus Promise is a city-led tuition program for students attending Columbus State Community College. In 2026 Shannon Hardin’s campaign announced a $10,000 donation to the program.', 'wexner-campaigns-2026'],
  'alex-fischer': ['Alex Fischer works in real estate and development consulting. WOSU reported that he contributed $10,000 to Andrew Ginther’s campaign in 2025.', 'campaign-developers-2025'],
  'alison-marker': ['Alison Marker leads the construction company Marker, Inc. WOSU reported that she personally contributed $5,000 to Andrew Ginther’s campaign in 2025.', 'marker-team', 'campaign-developers-2025'],
  'randy-marker': ['Randy Marker chairs the board of the construction company Marker, Inc. The company names Alison Marker as its president and CEO.', 'marker-team'],
  'marker-inc': ['Marker is a construction contractor. In July 2025 Columbus authorized a shared $400,000 pool for contractors that included Marker. The ordinance gives the ceiling for the whole group.', 'marker-city-pool'],
  pizzuti: ['Ron Pizzuti founded this real estate development company in 1976. Its public-project division, Pizzuti Solutions, works with governments and nonprofits to manage construction.', 'pizzuti-team', 'pizzuti-solutions'],
  'pizzuti-pac': ['This political action committee carries the Pizzuti name. WOSU reported that the committee contributed $10,000 to Andrew Ginther’s campaign in 2025.', 'campaign-developers-2025'],
  'pizzuti-stelzer': ['The Pizzuti Companies owns this project company. In July 2025 Columbus City Council approved a 75% property-tax abatement for ten years for its Stelzer Road project.', 'pizzuti-stelzer-eza'],
  'pizzuti-solutions': ['Pizzuti Solutions manages building projects on behalf of cities, counties and nonprofits, helping them plan the work and keep it on budget. The firm lists the Michael B. Coleman government office building in Columbus among its projects.', 'pizzuti-solutions'],
  'ron-pizzuti': ['Ron Pizzuti founded The Pizzuti Companies in 1976. The real estate developer identifies him as chairman and Joel Pizzuti as president and CEO.', 'pizzuti-team'],
  'joel-pizzuti': ['Joel Pizzuti became president and CEO of The Pizzuti Companies in 2006. Ron Pizzuti founded the real estate development firm three decades earlier.', 'pizzuti-team'],
  'george-mccue': ['George McCue represents clients before Columbus city government. The city’s November 2025 lobbying roster lists both The Pizzuti Companies and Pizzuti Solutions as his clients.', 'city-lobbyists-2025'],
  'byers-minton': ['Byers Minton & Associates represents clients in state government. In September 2025 Columbus City Council waived competitive bidding and authorized up to $60,000 for the firm to represent the city.', 'bma-city-contract'],
  'bill-byers': ['Bill Byers is a principal at Byers Minton & Associates. Ohio’s May 2026 lobbying register listed the City of Columbus, COTA and American Electric Power among his clients.', 'bma-team', 'byers-register'],
  'andrew-minton': ['Andrew Minton is a principal at Byers Minton & Associates. Ohio’s lobbying register also lists him as an agent for Anduril.', 'bma-team', 'flow-anduril-agents'],
  'jeff-edwards': ['Jeff Edwards leads Edwards Companies, a development group. The Columbus Partnership identifies him as a member of its executive committee.', 'partnership-founders'],
  'edwards-companies': ['Edwards Companies is a development group led by Jeff Edwards. The Columbus Partnership lists him as its chairman, CEO and president.', 'partnership-founders'],
  'new-albany-company': ['Les Wexner and Jack Kessler founded The New Albany Company in 1987. The real estate developer identifies Kessler as its chairman.', 'new-albany-company'],
  'jack-kessler': ['Jack Kessler co-founded The New Albany Company with Les Wexner in 1987. He later helped found the Columbus Partnership in 2002.', 'new-albany-company', 'partnership-founders'],
  'charter-operating': ['Charter Communications Operating is the employer named in Ohio’s lobbying register. The May 2026 roster lists Bill Byers as one of its registered agents.', 'byers-register'],
  hsg: ['Haslam Sports Group acquired operating rights to the Columbus Crew in 2019. Its sports portfolio also includes an ownership interest in the Cleveland Browns.', 'hsg-leadership'],
  'dee-haslam': ['Dee Haslam is a managing partner at Haslam Sports Group. The Columbus Partnership also lists her as CEO and managing partner of the Columbus Crew.', 'hsg-leadership', 'partnership-founders'],
  'jimmy-haslam': ['Jimmy Haslam is a managing partner of Haslam Sports Group. The group’s portfolio includes the Cleveland Browns and operating rights to the Columbus Crew.', 'hsg-leadership'],
  'whitney-johnson': ['Whitney Haslam Johnson is a managing partner at Haslam Sports Group. A July 2026 campaign report identified an $8,000 contribution from her to Andrew Ginther’s campaign.', 'hsg-leadership', 'haslam-gifts-2026'],
  'jw-johnson': ['JW Johnson is a managing partner at Haslam Sports Group. Reporting on Columbus campaign finances identified an $8,000 contribution from him to Andrew Ginther’s campaign in July 2026.', 'jw-johnson-profile', 'haslam-gifts-2026'],
  crew: ['The Columbus Crew is the city’s Major League Soccer club. Haslam Sports Group acquired operating rights in 2019, and the Edwards family invested in the club that year.', 'hsg-leadership', 'nwsl-ownership'],
  browns: ['The Cleveland Browns are an NFL team in the Haslam Sports Group portfolio. The same group acquired operating rights to Major League Soccer’s Columbus Crew in 2019.', 'hsg-leadership'],
  'pete-edwards': ['Dr. Pete Edwards is an investor in the Columbus Crew. In 2026 the National Women’s Soccer League named him in the ownership group for its new Columbus franchise.', 'nwsl-ownership'],
  'christine-edwards': ['Dr. Christine Edwards is part of the ownership group awarded a Columbus women’s professional soccer franchise in 2026. That group also includes Pete Edwards, Haslam Sports Group and Nationwide.', 'nwsl-ownership'],
  'nwsl-club': ['The National Women’s Soccer League awarded Columbus a franchise in April 2026. The announcement named the ownership group and set 2028 as the planned first season.', 'nwsl-ownership'],
  'nwsl-newco': ['Columbus’s soccer development agreement uses NEWCO for the ownership parties and affiliates behind its new women’s team. The league named Haslam Sports Group, Nationwide and Christine and Pete Edwards in the ownership group.', 'nwsl-agreement-2026', 'nwsl-ownership'],
  'confluence-authority': ['Columbus established the Confluence Community Authority in 2019. It owns the Crew’s stadium, and the city’s 2026 soccer agreement also gives it a role in the proposed women’s training facility.', 'nwsl-agreement-2026'],
  'mccoy-land': ['Columbus owns the roughly 28-acre McCoy Park site. The city’s April 2026 soccer agreement proposes using the site for a women’s professional training facility.', 'nwsl-agreement-2026'],
  'nwsl-training': ['The proposed training facility would serve Columbus’s new women’s soccer team. Under the 2026 plan the ownership group would direct construction and the Confluence Community Authority would own the facility.', 'nwsl-agreement-2026'],
  'nwsl-projects': ['Columbus’s 2026 agreement covers two facilities for women’s professional soccer. It calls for a new training facility and improvements to the stadium where the Crew plays.', 'nwsl-agreement-2026'],
  'crew-stadium': ['ScottsMiracle-Gro Field is the Columbus Crew’s home stadium. The Confluence Community Authority owns it, and the city’s 2026 soccer agreement calls for improvements there.', 'nwsl-agreement-2026', 'nwsl-ownership'],
  'confluence-village': ['In 2020 Haslam Sports Group, the Edwards family and The Pizzuti Companies announced a joint venture to develop Confluence Village near the Crew’s stadium.', 'confluence-jv'],
  'edwards-sports-family': ['The 2020 Confluence Village announcement names the Edwards family as a development partner alongside Haslam Sports Group and The Pizzuti Companies.', 'confluence-jv'],
  'parks-foundation': ['The city’s soccer development agreement names the Columbus Recreation & Parks Foundation as the beneficiary of a $3 million park contribution. The agreement makes it due by December 31, 2029.', 'nwsl-agreement-2026'],
  'gilbane-smoot-jv': ['Gilbane and Smoot teamed up to manage construction of Columbus’s new municipal court building. In July 2025 City Council authorized an increase of up to $841,900 to their agreement.', 'city-capital-2025'],
  'municipal-court-project': ['Columbus hired the Gilbane-Smoot joint venture to manage construction of its new municipal court building. Council authorized a contract increase of up to $841,900 in July 2025.', 'city-capital-2025'],
  'housing-coalition': ['Columbus City Council included $500,000 for the Regional Housing Coalition’s operations in a 2025 grant to the economic-development group One Columbus.', 'city-capital-2025'],
  'caa-pac': ['The Columbus Apartment Association’s political action committee contributed $5,000 to Shannon Hardin’s campaign, according to WOSU’s 2025 review of campaign records.', 'campaign-developers-2025'],
  'realtors-pac': ['The Central Ohio Realtors political action committee contributed $5,000 to Columbus council president Shannon Hardin’s campaign in WOSU’s 2025 reporting.', 'campaign-developers-2025'],
  'moun-dioun': ['WOSU identified Moun Dioun as a developer associated with The Stonehenge Company. It reported more than $15,000 in contributions from him to Shannon Hardin’s campaign in 2025.', 'campaign-developers-2025'],
  stonehenge: ['The Stonehenge Company is the developer WOSU identified when reporting on Moun Dioun’s political contributions. Its report attributes the contributions to Dioun personally.', 'campaign-developers-2025'],
  flock: ['Flock Safety supplies cameras that read vehicle license plates. In 2024 Columbus authorized a two-year lease for 38 of its fixed cameras for city police.', 'flock-contract-2024'],
  capobianco: ['Louis Capobianco represents companies before Columbus city government. The November 2025 city roster lists Flock Safety and Verizon as his lobbying clients.', 'city-lobbyists-2025'],
  google: ['Google is the parent of Montauk Innovations. New Albany’s council minutes identify that subsidiary as the company behind a 2018 development and tax-incentive agreement.', 'google-incentive-2018'],
  'stanley-gates': ['Stanley E. Gates II represents Google before public officials. Columbus listed him on its November 2025 lobbying roster, and Ohio lists him for both legislative and executive lobbying.', 'city-lobbyists-2025', 'flow-google-agents'],
  verizon: ['Verizon Communications appears in Columbus’s November 2025 lobbying roster. It identifies Louis Capobianco as an agent who represented the telecommunications company before the city.', 'city-lobbyists-2025'],
  'city-water-power': ['Columbus Water and Power is the city utility department involved in setting water rates. At a 2025 hearing, its deputy director explained a proposal for large commercial customers.', 'city-lobbyists-2025'],
  'jon-lee': ['Jon Lee spoke as deputy director of Columbus Water and Power at a 2025 utility hearing. He explained the proposed timetable for changing rates for large water users.', 'city-lobbyists-2025'],
  'large-water-users': ['City officials discussed data centers and breweries as examples of large commercial water users at a 2025 rates hearing. The discussion concerned a class of customers.', 'city-lobbyists-2025'],
  'water-rate-review': ['At a 2025 hearing, Columbus utility officials proposed changing commercial water rates for high-volume users in 2027. Council president Shannon Hardin questioned the delay.', 'city-lobbyists-2025'],
  'columbus-police': ['In 2024 Columbus City Council authorized its Division of Police to lease 38 fixed license plate readers from Flock Safety for two years.', 'flock-contract-2024'],
  ocjs: ['The Ohio Office of Criminal Justice Services administers grants. Columbus named the office as the funding source for its fiscal 2024 license plate reader project.', 'flock-contract-2024'],
  forcemetrics: ['ForceMetrics provides Informed Responder software for public safety agencies. In June 2025 Columbus authorized a free one-year trial through an amendment to its Flock Safety agreement.', 'forcemetrics-trial-2025'],
  'motorola-vigilant': ['Motorola’s Vigilant business supplies license plate reader subscriptions. In June 2026 Columbus waived competitive bidding and authorized $103,990 for subscriptions.', 'vigilant-contract-2026'],
  'garrett-langley': ['Garrett Langley founded Flock Safety. The company identified him as CEO in March 2025 when it announced $275 million in financing.', 'flock-financing-2025'],
  'flock-round-2025': ['Flock Safety announced a $275 million financing round in March 2025. It named Andreessen Horowitz as lead investor and identified the other firms that participated.', 'flock-financing-2025'],
  a16z: ['Andreessen Horowitz led the $275 million financing round that Flock Safety announced in March 2025. The figure covers the entire round.', 'flock-financing-2025'],
  'founders-fund': ['Founders Fund invests in technology companies. It participated in Flock Safety’s 2025 financing and co-led Anduril’s $1.5 billion financing round in 2024.', 'flock-financing-2025', 'flow-ff-anduril'],
  'new-albany-city': ['New Albany uses development agreements to attract investment. In December 2018 its council authorized a 15-year property-tax abatement for Google subsidiary Montauk Innovations.', 'google-incentive-2018'],
  montauk: ['Montauk Innovations is the Google subsidiary named in New Albany’s 2018 incentive agreement. The agreement required at least $750,000 in annual city revenue starting in 2021.', 'google-incentive-2018'],
  aws: ['Amazon Web Services develops data centers. New Albany’s 2024 budget describes a $3.5 billion AWS expansion announced for the city the previous year.', 'new-albany-budget-2024'],
  qts: ['QTS develops data centers. New Albany’s 2024 budget lists its planned $3.6 billion investment among the projects announced in 2023.', 'new-albany-budget-2024'],
  edged: ['Edged develops data centers. New Albany’s 2024 budget describes the company’s $246 million project among the investments announced for the city in 2023.', 'new-albany-budget-2024'],
  'aws-na-project': ['Amazon Web Services announced a $3.5 billion data-center expansion in New Albany in 2023. The city published that planned investment in its 2024 budget.', 'new-albany-budget-2024'],
  'qts-na-project': ['New Albany’s 2024 budget lists $3.6 billion in planned QTS data-center investment. The figure comes from the project announcement in 2023.', 'new-albany-budget-2024'],
  'edged-na-project': ['New Albany’s 2024 budget describes a planned $246 million data center from Edged. It lists the project among the investments announced in 2023.', 'new-albany-budget-2024'],
  'aep-ohio': ['AEP Ohio is the utility that administers special electricity rates for qualifying new data centers. The Public Utilities Commission of Ohio approved those terms in July 2025.', 'aep-data-tariff'],
  'marc-reitter': ['Marc Reitter led AEP Ohio as president and chief operating officer when the utility outlined its proposed electricity service terms for data centers in May 2024.', 'aep-ohio-plan-2024'],
  puco: ['The Public Utilities Commission of Ohio regulates electric utilities. In July 2025 it approved AEP Ohio’s special rate plan for qualifying new data centers.', 'aep-data-tariff'],
  dct: ['Schedule DCT sets electricity service terms for qualifying new data centers in AEP Ohio territory. It requires long-term commitments and a minimum level of billed demand.', 'aep-data-tariff'],
  'dct-customers': ['These are the new data-center customers that qualify for AEP Ohio’s special electricity rates. The tariff sets minimum bills and long-term commitments for this customer class.', 'aep-data-tariff'],
  'jd-vance': ['Before becoming vice president, JD Vance worked in venture capital. A 2020 securities filing identified him as a managing director of the general partner of Narya Capital Fund I.', 'political-vance', 'trail-narya-formd'],
  trump: ['Vivek Ramaswamy’s campaign named President Donald Trump among its supporters in November 2025, alongside Vice President JD Vance and Ohio House Speaker Matt Huffman.', 'political-coalition'],
  moreno: ['U.S. Senator Bernie Moreno backed Vivek Ramaswamy’s bid for Ohio governor in 2025. In January 2026 Vistra also published his statement supporting its Ohio nuclear power agreements with Meta.', 'political-allies', 'flow-vistra-meta'],
  dewine: ['Ohio Governor Mike DeWine helped announce Intel’s central Ohio manufacturing project in January 2022. The announcement also involved state and regional economic-development agencies.', 'political-intel'],
  tressel: ['Jim Tressel served as Ohio lieutenant governor alongside Governor Mike DeWine. The governor’s office identified both men when they launched an Ohio tour in August 2026.', 'political-administration'],
  'ohio-executive': ['The governor and lieutenant governor lead Ohio’s executive branch. State law gives the governor a direct role in JobsOhio by appointing its board members and chair.', 'political-jobsohio', 'political-administration'],
  'us-vice-presidency': ['JD Vance took office as U.S. vice president in 2025 after representing Ohio in the Senate. The White House biography traces that move from state representation to federal office.', 'political-vance'],
  huffman: ['Matt Huffman served as speaker of the Ohio House in the 136th General Assembly. In November 2025 Vivek Ramaswamy’s campaign listed him among its supporters.', 'political-house', 'political-coalition'],
  'ohio-house': ['The Ohio House of Representatives is one of the state’s two legislative chambers. Its biography of Matt Huffman identifies him as speaker of the 136th General Assembly.', 'political-house'],
  'ohio-senate': ['The Ohio Senate takes part in appointing Ohio State University trustees. The governor names trustees and the Senate gives its advice and consent under state law.', 'media-osu-law'],
  'ohio-gop': ['The Ohio Republican Party’s State Central Committee endorsed Vivek Ramaswamy for governor and Jon Husted for U.S. Senate in May 2025.', 'political-gop'],
  triantafilou: ['Alex Triantafilou chaired the Ohio Republican Party when its State Central Committee endorsed Vivek Ramaswamy and Jon Husted in May 2025.', 'political-gop'],
  strive: ['Vivek Ramaswamy co-founded this financial-services firm in 2022. In July 2024 Strive announced a $30 million financing round led by Cantor Fitzgerald.', 'political-strive'],
  'strive-round-2024': ['Strive announced that it raised $30 million in July 2024. Cantor Fitzgerald led the round, and Narya and Deason Capital Services participated.', 'political-strive'],
  narya: ['Narya is a venture investment firm. Strive named it as an investor in the $30 million financing round the company announced in July 2024.', 'political-strive'],
  'peter-thiel': ['Peter Thiel helped fund the super PAC Protect Ohio Values. Federal filings record $10 million from him in 2021 and additional contributions in 2022, when the group supported JD Vance’s Senate campaign.', 'trail-pov-2021', 'trail-pov-2022', 'trail-pov-spending'],
  'bill-ackman': ['Strive names Bill Ackman as one of its early investors. A separate V-PAC filing shows a $1 million contribution from him to the political group in 2026.', 'political-strive', 'trail-vpac-q2'],
  cantor: ['Cantor Fitzgerald led Strive’s $30 million financing round in July 2024. Strive’s announcement gives the total raised from all participating investors.', 'political-strive'],
  'deason-capital': ['Deason Capital Services participated in Strive’s July 2024 financing round. Strive named it alongside Narya and lead investor Cantor Fitzgerald.', 'political-strive'],
  'v-pac': ['V-PAC is an outside political group that supported Vivek Ramaswamy’s bid for governor. It raised and spent money through its own committee, including payments to New Albany media firm Flexpoint.', 'political-vpac', 'trail-vpac-q2'],
  'elon-musk': ['V-PAC’s federal filing records a $5 million contribution from Elon Musk on May 8, 2026. The super PAC supported Vivek Ramaswamy’s bid for Ohio governor.', 'trail-vpac-q2', 'political-vpac'],
  'jeff-yass': ['The Ohio Capital Journal reported that Jeff Yass contributed $20 million to V-PAC ahead of the 2026 primary. The outside group supported Vivek Ramaswamy’s campaign for governor.', 'political-vpac'],
  'ratmir-timashev': ['Ohio State announced a $110 million gift from the Timashev Family Foundation for a software center in 2023. Separately, V-PAC reported receiving a $5 million personal contribution from Ratmir Timashev in 2026.', 'political-osu', 'trail-vpac-q2'],
  'ross-stevens': ['V-PAC’s July 2026 federal filing identifies Ross Stevens as the source of a $1 million contribution. The group backed Vivek Ramaswamy in the Ohio governor’s race.', 'trail-vpac-q2', 'political-vpac'],
  'timashev-foundation': ['Ohio State announced a $110 million gift from the Timashev Family Foundation in 2023 to establish a university center for software innovation.', 'political-osu'],
  'ohio-state': ['Ohio State is a public university in Columbus. In 2023 its College of Engineering announced a $110 million gift from the Timashev Family Foundation to establish a software innovation center.', 'political-osu'],
  'software-center': ['Ohio State announced the Center for Software Innovation in 2023. A $110 million gift from the Timashev Family Foundation was to support the new center.', 'political-osu'],
  jobsohio: ['JobsOhio is a nonprofit that funds economic-development projects with proceeds from Ohio’s liquor business. For example, it signed a $310 million grant tied to hiring and investment commitments for Anduril’s Pickaway County factory.', 'flow-jobs-finance', 'flow-anduril-grant'],
  intel: ['Intel announced a central Ohio semiconductor manufacturing project with state and regional leaders in January 2022. JobsOhio later described plans for up to $150 million in grants.', 'political-intel', 'trail-intel-plan'],
  'rickenbacker-center': ['COTA broke ground on this transportation center in the Rickenbacker area in October 2023. Its announcement names Marker as the construction lead and identifies members of Congress who supported project funding.', 'political-rickenbacker'],
  'jobs-beverage': ['JobsOhio Beverage System operates the liquor business that helps fund JobsOhio. Its fiscal 2026 financial statements show a $280 million grant within the JobsOhio group.', 'flow-jobs-finance'],
  'jobs-consolidated': ['JobsOhio reports its finances together with its subsidiaries. Those consolidated accounts show how the group borrowed from and repaid The Huntington National Bank in fiscal 2026.', 'flow-jobs-finance'],
  'huntington-national': ['The Huntington National Bank provided the JobsOhio group a line of credit with a $125 million limit. The group’s fiscal 2026 accounts report $71.9 million in borrowing on the line that year.', 'flow-jobs-finance'],
  'jobs-audit-2013': ['Ohio’s state auditor examined JobsOhio’s operations in 2011 and 2012. Auditors found gaps in conflict screening and identified $59,747 in sampled payments that lacked invoices or receipts.', 'flow-jobs-audit'],
  'dave-yost': ['Dave Yost signed the 2013 JobsOhio audit as Ohio’s state auditor. The report examined how the organization documented expenses and checked for conflicts of interest in 2011 and 2012.', 'flow-jobs-audit'],
  'jobs-disclosure': ['Ohio law gives JobsOhio a special status for public records. It also identifies material the nonprofit must disclose, including specified records from its work with the state development agency.', 'flow-jobs-records', 'flow-jobs-contract'],
  'ohio-development': ['The Ohio Department of Development makes state incentive awards. Ohio law allows it to contract with JobsOhio for services while keeping decisions over public funds with the department.', 'flow-jobs-contract'],
  'ted-carter': ['Ted Carter resigned as Ohio State’s president in March 2026. University investigators found that he used his position to seek resources for a personal associate, podcast operator Krisanthe Vlachos.', 'flow-carter-report'],
  'krisanthe-vlachos': ['Krisanthe Vlachos operated The Callout podcast. In 2026 JobsOhio said it had paid $60,000 for a four-episode project and was reviewing the payment after one episode was completed.', 'flow-podcast'],
  'carter-investigation': ['Ohio State examined the circumstances of President Ted Carter’s March 2026 resignation. In April, its compliance and audit offices found that he used his position to seek university and partner resources for a personal associate.', 'flow-carter-report'],
  callout: ['Krisanthe Vlachos hosted The Callout podcast. JobsOhio said it paid $60,000 for a four-episode pilot and began reviewing the payment in March 2026 after one episode was completed.', 'flow-podcast'],
  'jp-nauseef': ['J.P. Nauseef led JobsOhio as president and CEO when it announced its $310 million conditional grant for Anduril’s Ohio manufacturing project in July 2025.', 'flow-anduril-grant'],
  'mark-kvamme': ['Mark Kvamme led JobsOhio before co-founding venture firm Drive Capital. In 2013 The Lantern reported on Ohio State’s $50 million allocation to the firm.', 'flow-drive'],
  'drive-capital': ['Former JobsOhio leader Mark Kvamme co-founded this venture firm. In 2013 The Lantern reported that Ohio State had allocated $50 million to a Drive Capital fund.', 'flow-drive'],
  'gordon-gee': ['E. Gordon Gee served as Ohio State’s president and sat on the JobsOhio board during the period covered by The Lantern’s 2013 reporting on the university’s Drive Capital investment.', 'flow-drive'],
  kasich: ['John Kasich was Ohio’s governor when his administration launched JobsOhio. The Lantern’s 2013 reporting traces the agency’s early leadership alongside the creation of Drive Capital.', 'flow-drive'],
  anduril: ['Anduril is developing the Arsenal-1 manufacturing facility in Pickaway County. In July 2025 JobsOhio signed a $310 million grant tied to the company’s hiring, payroll and investment commitments.', 'flow-anduril-grant'],
  'arsenal-one': ['Arsenal-1 is Anduril’s planned manufacturing facility in Pickaway County. The state’s 2025 announcement earmarked $70 million for infrastructure serving the site through the local port authority.', 'flow-anduril-ohio', 'trail-pickaway-infrastructure'],
  'kenny-mcdonald': ['Kenny McDonald represented the regional development group One Columbus as its president and CEO in the January 2025 announcement of Anduril’s Pickaway County factory.', 'flow-anduril-ohio'],
  'trae-stephens': ['Trae Stephens co-founded Anduril and serves as its executive chairman. Founders Fund, the venture capital firm where he is a partner, describes both roles in his biography.', 'flow-trae'],
  'anduril-round-2024': ['Anduril raised $1.5 billion in its 2024 Series F financing round. Founders Fund co-led the round, according to the law firm that represented it.', 'flow-ff-anduril'],
  'drew-cooper': ['Drew Cooper submitted testimony for JobsOhio to Ohio’s joint data-center committee in June 2026. It described the agency’s incentives for data-center suppliers, including grants to Vertiv.', 'flow-jobs-datacenters'],
  'data-center-committee': ['This Ohio legislative committee took testimony about data centers. In June 2026 JobsOhio described its role in advising the state on incentives and awarding grants to suppliers.', 'flow-jobs-datacenters'],
  vertiv: ['Westerville-based Vertiv supplies power and cooling equipment. JobsOhio told lawmakers it awarded the company $3 million for a Lawrence County project and $1 million for a Delaware County project.', 'flow-jobs-datacenters'],
  vistra: ['Vistra operates nuclear power plants in Ohio. In January 2026 it announced 20-year agreements with Meta for nuclear energy and capacity delivered through the shared electric grid.', 'flow-vistra-meta'],
  'vistra-pac': ['Vistra’s employee political action committee reported a $16,615 payment to the joint Ramaswamy–McColley campaign on May 7, 2026, in its federal filing.', 'flow-vistra-fec'],
  'vivek-rob-campaign': ['Vivek Ramaswamy and Rob McColley ran together for governor and lieutenant governor. Vistra’s employee PAC reported one $16,615 contribution to their joint campaign in May 2026.', 'flow-vistra-fec'],
  meta: ['Meta agreed to buy nuclear energy and capacity from Vistra under agreements announced in January 2026. The Ohio plants involved supply the shared electric grid.', 'flow-vistra-meta'],
  'vistra-meta-ppa': ['Vistra and Meta announced these 20-year nuclear power agreements in January 2026. Meta contracted for energy and capacity from plants that supply the shared electric grid.', 'flow-vistra-meta'],
  'freedom-frontier': ['Reporting on FirstEnergy’s records traced a $1 million payment in 2017 to this nonprofit. Reporters also traced money from Freedom Frontier to a super PAC backing Jon Husted’s earlier bid for governor.', 'flow-husted-money'],
  'ohio-conservatives-change': ['This super PAC supported Jon Husted’s earlier campaign for governor. Reporting on the money behind that effort identified more than $1 million from the nonprofit Freedom Frontier.', 'flow-husted-money'],
  'state-solutions': ['State Solutions is a nonprofit affiliated with the Republican Governors Association. Reporting on the 2018 Ohio governor’s race traced $2.5 million in FirstEnergy payments to the group.', 'flow-dewine-money'],
  'ohio-highway-patrol': ['Ohio’s Controlling Board authorized a Flock Safety subscription for the Highway Patrol in June 2024. The approval allowed up to $90,000 in each of two fiscal years.', 'trail-oshp-flock'],
  'ohio-tax-credit-authority': ['Ohio’s Tax Credit Authority approved a 30-year payroll tax credit for Anduril’s Pickaway County project in January 2025. Its approval lists commitments for new jobs and payroll.', 'trail-anduril-tax'],
  'pickaway-port': ['Ohio approved $86 million in infrastructure funding for the Pickaway County Port Authority in February 2025. It earmarked $70 million of that award for infrastructure serving Anduril’s Arsenal-1 site.', 'trail-pickaway-infrastructure'],
  'vance-enterprises': ['JD Vance’s 2025 financial disclosure lists Narya fund interests and a Huntington bank account through this Cincinnati company. The form reports ranges for the value of those assets.', 'trail-vance-oge'],
  'narya-fund-ii': ['JD Vance’s 2025 financial disclosure lists an interest in Narya Fund II through Vance Enterprises. He reported its value in the $15,001 to $50,000 range.', 'trail-vance-oge'],
  'narya-gp-i': ['This company is the general partner of Narya Fund I. JD Vance’s 2025 disclosure describes his rights to a share of investment profits and certain fees under an agreement with it.', 'trail-vance-oge'],
  'protect-ohio-values': ['Protect Ohio Values was an outside political group that supported JD Vance’s 2022 Senate campaign. Its federal filings identify Peter Thiel as a major contributor and list spending to support Vance.', 'trail-pov-2021', 'trail-pov-spending'],
  envoi: ['Protect Ohio Values paid Envoi $49,999.99 for messaging in support of JD Vance during his 2022 Senate campaign. The outside group reported the payment in a federal filing.', 'trail-pov-spending'],
  'narya-fund-i': ['A 2020 securities filing identifies the managers behind Narya Capital Fund I. Vivek Ramaswamy later listed an interest and a capital commitment in the fund in his 2025 financial disclosure.', 'trail-narya-formd', 'trail-vivek-fds'],
  '8vc-fund-iii': ['Vivek Ramaswamy listed this investment fund as a source of income on his 2025 financial disclosure. The fund’s 2020 securities filing names Joe Lonsdale as a managing member of its general partner.', 'trail-vivek-fds', 'trail-8vc-formd'],
  '8vc': ['Joe Lonsdale founded the venture firm 8VC. The firm lists Anduril among its portfolio companies and describes Lonsdale as an early investor.', 'trail-lonsdale', 'trail-8vc-anduril'],
  'joe-lonsdale': ['Joe Lonsdale founded the venture capital firm 8VC. Its biography describes him as a managing partner and an early investor in Anduril.', 'trail-lonsdale'],
  'amazon-parent': ['Amazon.com is the parent company of Amazon Web Services. Vivek Ramaswamy listed Amazon.com stock in his financial disclosure covering 2025.', 'trail-amazon-aws', 'trail-vivek-fds'],
  microsoft: ['Microsoft hired Ames Construction for its New Albany data-center project. Its October 2026 update said the early construction work was complete.', 'trail-microsoft-ohio', 'trail-microsoft-oct2026'],
  nvidia: ['Vivek Ramaswamy listed NVIDIA stock among his investments on his annual financial disclosure covering 2025. The filing describes his personal holdings for that reporting period.', 'trail-vivek-fds'],
  'microsoft-new-albany': ['Microsoft hired Ames Construction for its New Albany data-center site. In October 2026 Microsoft reported that early construction work had finished and that it would again handle community contact.', 'trail-microsoft-ohio', 'trail-microsoft-oct2026'],
  'ames-construction': ['Microsoft named Ames Construction as the general contractor for its New Albany data-center project. Its July 2026 project update described work to prepare the site.', 'trail-microsoft-ohio'],
  'willa-ebersole': ['Ohio’s lobbying register lists Willa Ebersole as an agent for Microsoft. Her registrations cover both the legislative and executive branches of state government.', 'trail-microsoft-agents'],
  'flexpoint-media': ['Flexpoint Media is a New Albany vendor that V-PAC hired for opposition advertising. In its July 2026 federal filing, the committee reported one payment of nearly $8 million and a separate $219,000 payment to the firm.', 'trail-vpac-q2'],
  'state-incentive-review-2025': ['Ohio’s state auditor reviewed job commitments from 60 recipients of state incentives. The December 2025 report found 39 fell short. The review covered awards overseen by the Ohio Department of Development.', 'trail-state-compliance'],
  wsyx: ['WSYX is a Columbus television station in Sinclair’s broadcast group. WSYX Licensee, Inc. holds its FCC license, and ABC supplies network programming.', 'media-fcc-wsyx', 'media-sinclair'],
  'wsyx-licensee': ['WSYX Licensee, Inc. holds the federal broadcast license for Columbus station WSYX. The FCC identifies Sinclair Broadcast Group as the operating group behind the license company.', 'media-fcc-wsyx'],
  'sinclair-group': ['Sinclair Broadcast Group operates Columbus station WSYX. It also provides services to WTTE under an agreement with that station’s owner, Cunningham.', 'media-sinclair'],
  'sinclair-inc': ['Sinclair, Inc. is the publicly traded parent of Sinclair Broadcast Group. Its 2026 shareholder filing says four Smith brothers together control more than half of the voting power.', 'media-sinclair', 'media-smith'],
  'smith-brothers': ['David, Frederick, J. Duncan and Robert Smith together hold more than half the voting power at Sinclair, according to its 2026 shareholder filing. The brothers have an agreement on voting for directors.', 'media-smith'],
  'david-smith': ['David Smith chairs Sinclair’s board as executive chairman. He and his three brothers together hold more than half the company’s voting power, according to its 2026 shareholder filing.', 'media-smith'],
  cunningham: ['Cunningham owns the station company behind WTTE in Columbus. Sinclair’s annual filing describes a service agreement between the broadcasters and non-voting interests held in family trusts.', 'media-sinclair'],
  'smith-child-trusts': ['These trusts benefit children of Sinclair’s controlling shareholders. Sinclair’s annual filing describes their non-voting interests in Cunningham station companies, including the group behind WTTE.', 'media-sinclair'],
  wtte: ['WTTE is a Columbus television station owned through Cunningham. Sinclair provides services to the station under a separate agreement described in its annual filing.', 'media-sinclair'],
  wwho: ['WWHO carries CW programming in Columbus. Sinclair reports that it bought the station’s license assets from Manhan Media in October 2025 after previously providing services to the station.', 'media-sinclair'],
  manhan: ['Manhan Media held the license assets for Columbus television station WWHO. Sinclair reports that it acquired those assets from Manhan in October 2025.', 'media-sinclair'],
  'abc-network': ['ABC supplies network programming to WSYX in Columbus. Sinclair identifies WSYX as an ABC affiliate in its annual station list.', 'media-sinclair'],
  'cw-network': ['The CW supplies network programming to Columbus station WWHO. Sinclair’s annual filing identifies the affiliation and its 2025 purchase of WWHO’s license assets.', 'media-sinclair'],
  wcmh: ['WCMH, known locally as NBC4, is a Columbus television station. Nexstar operates it through its broadcasting subsidiary, and NBC supplies its network programming.', 'media-nexstar', 'media-stations'],
  'nexstar-operating': ['Nexstar’s broadcasting subsidiary owns and operates WCMH in Columbus. The company identifies this local NBC affiliate in its station portfolio.', 'media-nexstar'],
  nexstar: ['Nexstar is the broadcast group behind Columbus station WCMH. It announced its acquisition of TEGNA in March 2026. A federal court later ordered the two companies to operate independently.', 'media-nexstar', 'media-close', 'media-injunction'],
  'perry-sook': ['Perry Sook founded Nexstar. The broadcaster named him as chairman and CEO when it announced the completion of its TEGNA acquisition in March 2026.', 'media-close'],
  wbns: ['Columbus station WBNS carries CBS programming. TEGNA bought it in 2019 as part of a purchase of television and radio properties from Dispatch Broadcast Group.', 'media-stations', 'media-tegna-2019'],
  tegna: ['TEGNA acquired Columbus station WBNS in 2019. After Nexstar announced its purchase of TEGNA in 2026, a federal court order required the two businesses to operate independently.', 'media-tegna-2019', 'media-injunction', 'media-close'],
  'dispatch-broadcast': ['Dispatch Broadcast Group sold its broadcast properties, including WBNS television and radio, to TEGNA in 2019. The Dispatch newspaper had changed hands in a separate sale in 2015.', 'media-tegna-2019', 'media-dispatch-2015'],
  'nbc-network': ['NBC supplies network programming to WCMH in Columbus. Nexstar lists WCMH as an NBC affiliate in its station directory.', 'media-stations'],
  'cbs-network': ['CBS supplies network programming to WBNS in Columbus. The local station carries the network under an affiliation agreement.', 'media-stations'],
  'tegna-litigation': ['A federal court ordered Nexstar and TEGNA to maintain separate operations during litigation over their acquisition. An August 2026 clarification addressed operating independence and board appointments.', 'media-injunction'],
  wtvn: ['WTVN is a Columbus news and talk radio station in the iHeartMedia group. Its schedule includes the nationally syndicated Sean Hannity Show.', 'media-iheart-local', 'media-wtvn-schedule'],
  iheart: ['iHeartMedia operates Columbus radio station WTVN. Its subsidiary Premiere Networks distributes nationally syndicated programs, including The Sean Hannity Show.', 'media-iheart-local', 'media-premiere'],
  premiere: ['Premiere Networks is iHeartMedia’s radio syndication company. It distributes programs such as The Sean Hannity Show to stations around the country.', 'media-premiere'],
  'hannity-show': ['Premiere Networks distributes The Sean Hannity Show nationally. Columbus news and talk station WTVN lists it on its programming schedule.', 'media-premiere', 'media-wtvn-schedule'],
  pimco: ['iHeartMedia’s 2026 shareholder filing listed a 17.4% voting stake under PIMCO. The disclosure covers shares managed for advisory clients and draws on a February 2024 filing.', 'media-iheart-proxy'],
  'global-media-investments': ['iHeartMedia’s 2026 shareholder filing lists Global Media & Entertainment Investments with 14% of its voting shares. The table draws on an ownership filing from May 2022.', 'media-iheart-proxy'],
  'michael-tabor': ['iHeartMedia’s shareholder filing names Michael Tabor as a trust beneficiary in the ownership chain behind Global Media’s stake. The disclosure describes shared voting rights.', 'media-iheart-proxy'],
  dispatch: ['The Columbus Dispatch is a local newspaper in the USA TODAY Co. publishing group. New Media bought the newspaper’s publishing assets in 2015 for $47 million.', 'media-dispatch-current', 'media-dispatch-2015'],
  'usa-today-co': ['USA TODAY Co. lists The Columbus Dispatch among its newspapers. The publishing group adopted its current corporate name in 2025 after previously operating as Gannett.', 'media-dispatch-current', 'media-rename'],
  'new-media-2015': ['New Media bought The Columbus Dispatch’s publishing assets in 2015 for $47 million. In 2019 it acquired Gannett, and the combined publisher took the Gannett name.', 'media-dispatch-2015', 'media-gannett-2019'],
  'business-first': ['Columbus Business First is a local business newspaper published by American City Business Journals. It identifies Nick Fortine as publisher and Doug Buchanan as the editor who leads the newsroom.', 'media-business-first'],
  acbj: ['American City Business Journals publishes Columbus Business First. Advance includes the business newspaper group in its corporate portfolio.', 'media-business-first', 'media-advance'],
  advance: ['Advance is a privately held company owned by the Newhouse family. Its portfolio includes American City Business Journals, the publisher of Columbus Business First.', 'media-advance', 'media-business-first'],
  'newhouse-family': ['The Newhouse family owns Advance, the private company behind American City Business Journals. That chain connects the family to the publisher of Columbus Business First.', 'media-advance', 'media-business-first'],
  'nick-fortine': ['Nick Fortine oversees business operations as market president and publisher of Columbus Business First. The publication identifies Doug Buchanan as the editor responsible for its newsroom.', 'media-business-first'],
  'doug-buchanan': ['Doug Buchanan leads the Columbus Business First newsroom as editor in chief. In his professional biography he also discloses board service with the Columbus Metropolitan Club.', 'media-business-first'],
  'columbus-metropolitan-club': ['The Columbus Metropolitan Club is a civic forum. Doug Buchanan, editor in chief of Columbus Business First, discloses serving on its board in his professional biography.', 'media-business-first'],
  ocj: ['The Ohio Capital Journal is a nonprofit statehouse newsroom in the States Newsroom network. It says that it publishes without advertising and retains editorial independence.', 'media-ocj'],
  'states-newsroom': ['States Newsroom is a nonprofit network of state-focused news outlets. Its Ohio publication, the Ohio Capital Journal, identifies grants and donations as sources of support.', 'media-ocj'],
  'david-dewitt': ['David DeWitt leads the Ohio Capital Journal as editor in chief. The outlet covers state government as part of the nonprofit States Newsroom network.', 'media-ocj'],
  'chris-fitzsimon': ['Chris Fitzsimon is publisher and CEO of States Newsroom. The nonprofit describes his responsibilities as leading editorial strategy and fundraising for the network.', 'media-states-team'],
  'adam-searing': ['States Newsroom lists Adam Searing as both a board director and treasurer. The nonprofit network publishes state-focused journalism, including the Ohio Capital Journal.', 'media-states-team', 'media-ocj'],
  'wyss-foundation': ['States Newsroom lists the Wyss Foundation among supporters who gave more than $1,000 cumulatively from November 2019 onward. Its disclosure names donors to the national network.', 'media-states-support'],
  'columbus-underground': ['Walker and Anne Evans own and operate Columbus Underground, a local digital news outlet. They describe local advertising, sponsorships, event tickets and readers as sources of revenue.', 'media-underground'],
  'walker-evans': ['Walker Evans co-owns and operates Columbus Underground with Anne Evans. Their account of the local news business describes how advertising, events and reader support pay for its work.', 'media-underground'],
  'anne-evans': ['Anne Evans co-owns and operates Columbus Underground with Walker Evans. The two describe the publication as locally owned and identify its advertising, events and reader revenue.', 'media-underground'],
  wosu: ['WOSU provides public radio, television and digital news in central Ohio. Ohio State’s trustees hold its broadcast licenses, and WOSU belongs to both NPR and PBS.', 'media-wosu-board', 'media-wosu-about'],
  'osu-trustees': ['Ohio State’s Board of Trustees holds WOSU’s broadcast licenses. Ohio law gives the governor appointment power over university trustees with the Senate’s advice and consent.', 'media-wosu-board', 'media-osu-law'],
  'wosu-friends': ['Friends of WOSU is an advisory and fundraising board. WOSU describes its members as a link to the community and identifies Ohio State’s trustees as the broadcast license holders.', 'media-wosu-board'],
  cpb: ['The Corporation for Public Broadcasting provided grant support to WOSU. In its fiscal 2024 accounts, WOSU reported just over $2 million in CPB grant revenue.', 'media-wosu-finance'],
  npr: ['NPR supplies programming to member radio stations. In Columbus, WOSU identifies itself as an NPR member and WCBE describes itself as a charter member.', 'media-wosu-about', 'media-wcbe'],
  pbs: ['PBS is the public television network to which WOSU belongs. WOSU lists its PBS television membership alongside its NPR radio membership.', 'media-wosu-about'],
  wcbe: ['WCBE is a public radio service of Columbus City Schools. The station identifies itself as a charter member of NPR and carries NPR newscasts.', 'media-wcbe'],
  'columbus-schools': ['Columbus City Schools is the public school district behind radio station WCBE. The station describes itself as a district service and a charter member of NPR.', 'media-wcbe'],
  'greg-moebius': ['WCBE names Greg Moebius as its general manager in an announcement about moving to a more music-focused schedule. The announcement gives October 26 as the change date without naming a year.', 'media-wcbe-format'],
  'acton-campaign': ['Amy Acton and David Pepper’s campaign said it raised more than $13.2 million from July through September 2026. The announcement reports fundraising for their joint Ohio ticket.', 'pc26-acton-finance'],
  'vivek-campaign': ['Vivek Ramaswamy and Rob McColley’s campaign reported in April 2026 that Ramaswamy put $25 million of his own money into their campaign. It reported another $5 million from donors.', 'pc26-vivek-finance'],
  'brown-campaign-2026': ['This is Sherrod Brown’s principal committee for the 2026 U.S. Senate race in Ohio. Its federal filings report campaign receipts and spending, and list its participation in the Ohio Grassroots Victory Fund.', 'pc26-brown-committee', 'pc26-brown-joint'],
  'husted-campaign-2026': ['This is Jon Husted’s principal campaign committee for the 2026 U.S. Senate race in Ohio. Federal filings identify a $5,000 contribution from American Electric Power’s political action committee.', 'pc26-husted-committee', 'pc26-aep-filing'],
  'redpath-campaign-2026': ['William Redpath ran for the U.S. Senate in Ohio in 2026. His federal campaign committee reported both contributions and loans from the candidate as distinct sources of funds.', 'pc26-redpath-committee'],
  'aep-pac': ['American Electric Power is the company connected to this federal political action committee. The PAC reported a $5,000 contribution to Jon Husted’s Senate committee.', 'pc26-aep-pac', 'pc26-aep-filing'],
  kidspac: ['KidsPAC is a federal political action committee. It reported two $5,000 contributions to Sherrod Brown’s committee, one for the primary and one for the general election.', 'pc26-kidspac-filing'],
  'ohio-grassroots-victory': ['The Ohio Grassroots Victory Fund raises money jointly for participating committees. Its federal filing names Sherrod Brown’s campaign, the Ohio Democratic Party’s federal committee, America Works PAC and the Democratic Senatorial Campaign Committee.', 'pc26-brown-joint'],
  'ohio-democrats-federal': ['The Ohio Democratic Party’s federal fundraising committee appears in the paperwork for the Ohio Grassroots Victory Fund. The filing lists it as a joint fundraising participant alongside Sherrod Brown’s campaign.', 'pc26-brown-joint'],
  'america-works-pac': ['America Works PAC is a political committee listed in the Ohio Grassroots Victory Fund’s federal filing. It participates in joint fundraising with Sherrod Brown’s campaign and party committees.', 'pc26-brown-joint'],
  dscc: ['The Democratic Senatorial Campaign Committee is a participant in the Ohio Grassroots Victory Fund. The federal filing also names Sherrod Brown’s campaign and the Ohio Democratic Party’s federal committee.', 'pc26-brown-joint'],
  'ohio-health-department': ['The Ohio Department of Health is the state’s public-health agency. Amy Acton’s campaign biography recounts that Governor Mike DeWine asked her to serve as its director.', 'pc26-acton-bio'],
  'columbus-foundation': ['The Columbus Foundation holds charitable funds for local causes. In 2022 RAPID 5 announced a $1 million gift from developer Thrive Companies through a fund held at the foundation.', 'pc26-rapid5-gift'],
  rapid5: ['RAPID 5 works on central Ohio’s rivers and parks. In 2022 it named Amy Acton as its president and CEO and announced a $1 million gift from Thrive Companies.', 'pc26-rapid5-gift'],
  'rapid5-fund': ['The RAPID 5 Fund at The Columbus Foundation supports the central Ohio rivers and parks initiative. In 2022 RAPID 5 announced a $1 million gift to the fund from Thrive Companies.', 'pc26-rapid5-gift'],
  'thrive-companies': ['Thrive Companies is a central Ohio developer. In 2022 RAPID 5 announced a $1 million charitable gift from Thrive through a fund at The Columbus Foundation.', 'pc26-rapid5-gift'],
  'ryan-lehman': ['Ohio lists Ryan Lehman as a lobbyist for Flock Group, the license plate camera company. His registration covers the state legislature and executive branch.', 'flow-flock-agents'],
  'gary-smith-jr': ['Gary E. Smith Jr. represents Flock Group in Ohio. The state lobbying roster lists him for work involving both legislators and executive agencies.', 'flow-flock-agents'],
  'anthony-aquillo': ['Anthony Aquillo represents Motorola Solutions before Ohio officials. The state register lists him for lobbying in both the legislative and executive branches.', 'flow-motorola-agents'],
  'michael-toman': ['Ohio’s lobbying roster lists Michael Toman as an agent for Motorola Solutions. His registration covers work before lawmakers and executive agencies.', 'flow-motorola-agents'],
  'mckenzie-davis': ['McKenzie Davis is a registered legislative lobbyist for Motorola Solutions in Ohio. The state roster identifies the company as the client she represents before lawmakers.', 'flow-motorola-agents'],
  'fletch-zimpher': ['Fletch Zimpher is a registered Motorola Solutions lobbyist in Ohio. The state roster lists both legislative and executive branch work.', 'flow-motorola-agents'],
  'chris-slagle': ['Chris Slagle represents Google in Ohio. The state lobbying register lists him as an agent for work with both the legislature and executive agencies.', 'flow-google-agents'],
  'pizzuti-short-north-office': ['Columbus named this company in a 75% property-tax abatement for a Short North office project. A 2018 ordinance amended the agreement after a city tax-incentive review.', 'enrich-shortnorth-2018'],
  'columbus-tirc': ['Columbus’s Tax Incentive Review Council examines local tax agreements. A 2018 ordinance recounts its recommendation on the Pizzuti Short North office project.', 'enrich-shortnorth-2018'],
  'matt-starr': ['COTA’s October 2026 trustee roster lists Matt Starr for the 2025–2028 term. It also identifies his real estate and leasing work at Crawford Hoying.', 'enrich-cota-board-2026'],
  'crawford-hoying': ['Crawford Hoying is a real estate business. The regional transit authority’s October 2026 roster names it as the employer of trustee Matt Starr, who works in real estate and leasing.', 'enrich-cota-board-2026'],
  'amy-taylor': ['Columbus appointed Amy Taylor to COTA’s board for the 2026–2029 term. The transit authority’s roster also identifies her as president of Downtown Columbus Inc.', 'enrich-cota-board-2026'],
  'downtown-columbus-inc': ['Downtown Columbus Inc. is a civic organization led by Amy Taylor. COTA identifies her employer in its roster of trustees appointed to oversee regional transit.', 'enrich-cota-board-2026'],
  'trudy-bartley': ['Columbus appointed Trudy Bartley to COTA’s board for the 2024–2027 term. The transit authority’s roster identifies her community-relations role at Ohio State.', 'enrich-cota-board-2026'],
  'ep-ferris': ['E.P. Ferris is an engineering and land-development firm led by Matthew Ferris. Columbus authorized engineering work from the firm for a 17th Avenue project.', 'donation-ferris-team', 'donation-ferris-contract-2024'],
  'dovilla-campaign': ['Ohio’s campaign-finance portal identifies Mike Dovilla’s committee as entity 12885. Reporting on the 2026 state House race traces contributions to this committee.', 'donation-dovilla-identity', 'donation-dovilla-report'],
  'klein-campaign-reported': ['This record follows campaign contributions to Columbus City Attorney Zach Klein reported by WOSU in 2025. WOSU identifies Klein as the recipient in its review of local campaign fundraising.', 'campaign-developers-2025'],
  'j-epstein-foundation': ['Ohio State identified the J. Epstein Foundation among the donors to the Wexner Center for the Arts. Its giving review confirmed $260,000 in gifts from the foundation during the 1990s.', 'ep26-osu-review'],
  'wexner-center-arts': ['The Wexner Center for the Arts is Ohio State’s arts center. The university’s 2020 giving review identified $260,000 that the J. Epstein Foundation contributed to it during the 1990s.', 'ep26-osu-review'],
  'les-wexner-charitable-fund': ['Ohio State’s records name the Leslie H. Wexner Charitable Fund in funding for a football complex addition. Its giving records identify a $2.5 million gift from the fund.', 'ep26-osu-giving'],
  'wexner-children-trust': ['Ohio State’s giving review identified the Wexner Children’s Trust and the Leslie H. Wexner Charitable Fund as the original sources of a gift routed through the C.O.U.Q. Foundation.', 'ep26-osu-review'],
  'woody-hayes-center': ['Ohio State’s 2007 gift agreement identifies an addition to the Woody Hayes Athletic Center as the project the gifts would support. It specifies how the university would recognize the gifts.', 'ep26-osu-agreement'],
  'ohio-ag-trafficking-initiative': ['In 2020 Ohio State announced it would contribute $336,000 to the Ohio attorney general’s anti-trafficking initiative after reviewing historical Epstein gifts and pledges.', 'ep26-osu-review'],
  'house-oversight-committee': ['The U.S. House Oversight Committee took Les Wexner’s deposition in Ohio in 2026 as part of its Epstein investigation. The committee published video of the questioning.', 'ep26-house-deposition'],
  'redflex-holdings': ['The Justice Department identified Melbourne-based Redflex Holdings as the parent of Redflex Traffic Systems in its 2016 announcement about the Ohio red-light camera case.', 'redflex-npa'],
  'columbus-photo-red-light': ['Columbus police used this program to enforce red-light laws with cameras. In 2013 the city approved an extension of its agreement with camera vendor Redflex.', 'rf26-ordinance-2013', 'rf26-amendment-2013'],
  'redflex-ohio-proceedings': ['Federal prosecutors pursued separate cases involving Columbus red-light camera contracts. Redflex executive Karen Finley pleaded guilty in the bribery case, and lobbyist John Raphael pleaded guilty to extortion.', 'redflex-plea', 'redflex-npa'],
  'redflex-corporate-npa': ['In December 2016 federal prosecutors announced a non-prosecution agreement with Redflex Traffic Systems. It required the company to pay Columbus $100,000 in restitution.', 'redflex-npa'],
  'mitchell-j-brown': ['A 2013 amendment to Columbus’s Redflex camera agreement names Mitchell J. Brown as public safety director. His name appears on the city’s signature line, which the posted copy leaves blank.', 'rf26-amendment-2013'],
  'robert-devincenzi': ['The vendor signature block on the 2013 Columbus red-light camera amendment identifies Robert DeVincenzi as Redflex CEO. The posted copy shows a vendor signature and leaves its date field blank.', 'rf26-amendment-2013'],
  ginther: ['Andrew Ginther became Columbus’s 53rd mayor after serving on City Council. The city’s official biography describes his third term as mayor.', 'mayor'],
  fehrman: ['Bill Fehrman leads American Electric Power as chairman, president and CEO. His company biography also lists him as a board member of the Columbus Partnership.', 'fehrman'],
  bbw: ['Bath & Body Works took its present corporate name in August 2021. Previously the company operated as L Brands, the retailer founded by Les Wexner.', 'rename', 'lbrands-2020'],
  abigail: ['Abigail Wexner helped fund the Wexner Foundation and served as its co-chair. L Brands announced her retirement from its board in its 2021 shareholder filing.', 'wexner-story', 'lbrands-2021'],
  foundation: ['Les and Abigail Wexner supported and led the Wexner Foundation. A review it commissioned traced Jeffrey Epstein’s service as a trustee from December 1992 to September 2007.', 'wexner-story', 'wexner-review'],
  empowering: ['The SEC found that American Electric Power formed and funded this nonprofit and directed its spending. Bank records show six payments from it to Generation Now totaling $700,000.', 'aep-order', 'gn-bank'],
  'financial-trust': ['A review commissioned by the Wexner Foundation identified Jeffrey Epstein as Financial Trust Company’s sole shareholder. It traced a January 2008 transfer of Apple shares worth about $34.28 million to the YLK Charitable Fund.', 'wexner-review'],
  couq: ['A review commissioned by the Wexner Foundation traced a January 2008 transfer from the C.O.U.Q. Foundation to Abigail Wexner’s YLK Charitable Fund. The transferred assets had a book value of about $12.38 million.', 'wexner-review'],
  ylk: ['Abigail Wexner established the YLK Charitable Fund in December 2007. A commissioned review traced assets with a combined book value of about $46.66 million into the fund in January 2008.', 'wexner-review'],
  'matthew-ferris': ['Matthew Ferris became president of the engineering firm E.P. Ferris in 2012. WOSU reported $10,000 in personal contributions from him to Andrew Ginther’s campaign in 2025.', 'donation-ferris-team', 'campaign-developers-2025'],
  'mike-dovilla': ['Mike Dovilla ran for Ohio House District 17 in 2026. Reporting on his campaign identified contributions from lobbyists Bill Byers and Andrew Minton.', 'donation-dovilla-report'],
  'zach-klein': ['Zach Klein served as Columbus city attorney when WOSU examined local campaign fundraising in 2025. It reported a $5,000 contribution to his campaign from a building-industry PAC.', 'campaign-developers-2025'],
  'mark-corna': ['WOSU identified Mark Corna with Continental Development Ventures in its 2025 campaign-finance reporting. It reported that he gave $1,000 to City Attorney Zach Klein’s campaign.', 'campaign-developers-2025'],
  'continental-development-ventures': ['WOSU identified Continental Development Ventures as Mark Corna’s business affiliation when it reported his $1,000 personal contribution to Columbus City Attorney Zach Klein’s campaign.', 'campaign-developers-2025'],
  'bia-central-ohio-pac': ['WOSU reported that this central Ohio building-industry political action committee gave $5,000 to Columbus City Attorney Zach Klein’s campaign in 2025.', 'campaign-developers-2025'],
  'amy-acton': ['Amy Acton directed the Ohio Department of Health before leading central Ohio parks nonprofit RAPID 5. She ran for governor in 2026 on a ticket with David Pepper.', 'pc26-acton-bio', 'pc26-ballot'],
  'david-pepper': ['David Pepper chaired the Ohio Democratic Party before running for lieutenant governor in 2026. He and gubernatorial candidate Amy Acton ran on the same ticket.', 'pc26-pepper-bio', 'pc26-ballot'],
  vivek: ['Vivek Ramaswamy co-founded the financial-services firm Strive in 2022. He ran for Ohio governor in 2026 on a joint ticket with Rob McColley.', 'political-strive', 'pc26-ballot'],
  mccolley: ['Rob McColley served as president of the Ohio Senate. In 2026 he ran for lieutenant governor alongside Vivek Ramaswamy.', 'political-senate', 'pc26-ballot'],
  crawley: ['Erica Crawley served on the Franklin County Board of Commissioners and represented the county in the LinkUS transportation initiative. She ran for county commissioner in 2026.', 'linkus', 'pc26-ballot'],
};

const candidates = new Map(campaignRoster.map(row => [row.id, row]));
const offices = {
  Governor: 'governor of Ohio', 'Lieutenant governor': 'lieutenant governor of Ohio',
  'U.S. Senate': 'Ohio’s U.S. Senate seat', 'Attorney general': 'Ohio attorney general',
  'State auditor': 'Ohio state auditor', 'Secretary of state': 'Ohio secretary of state',
  'State treasurer': 'Ohio state treasurer', 'County auditor': 'Franklin County auditor',
  'County commissioner': 'Franklin County commissioner',
  'U.S. House · OH-03': 'the U.S. House in Ohio’s 3rd District',
  'U.S. House · OH-15': 'the U.S. House in Ohio’s 15th District'
};
const numbers = new Intl.NumberFormat('en-US');
const dates = new Intl.DateTimeFormat('en-US', {month:'short', day:'numeric', year:'numeric', timeZone:'UTC'});

function returnsLabel(result) {
  return result.certified ? 'Certified results' : 'Unofficial returns';
}

function candidateIntro(node, row, names) {
  const result = node.electionResult;
  const office = offices[row.office] || row.office;
  const party = ['Democratic','Republican','Libertarian'].includes(row.party) ? ' on the '+row.party+' ticket' : '';
  const candidacy = node.writeIn ? ' ran as a write-in candidate for ' : ' ran for ';
  const first = node.name+candidacy+office+party+' in '+node.electionCycle+'.';
  const date = dates.format(new Date(result.sourceUpdatedAt));
  const partner = result.selectionCandidateIds?.find(id => id !== node.id);
  const recipient = partner ? (names.has(partner) ? 'the joint ticket with '+names.get(partner) : 'the joint ticket') : 'this candidate';
  const count = result.votes == null ? 'give no separate vote total for this candidacy' :
    'recorded '+numbers.format(result.votes)+' votes for '+recipient;
  return [first+' '+returnsLabel(result)+' from '+date+' '+count+'.', 'pc26-ballot', result.sourceId];
}

export function buildEntitySummaries(nodes, edges, sources) {
  const names = new Map(nodes.map(node => [node.id,node.name]));
  const published = new Set(sources.map(source => source.id));
  const cited = ids => ids?.length > 0 && ids.every(id => published.has(id));
  const raceLeaders = new Map();
  const firstLink = new Map();
  for (const node of nodes) {
    const result = node.electionResult;
    if (result?.standing === 'leading' && result.selectionCandidateIds?.[0] === node.id) {
      if (!raceLeaders.has(result.raceId)) raceLeaders.set(result.raceId, []);
      raceLeaders.get(result.raceId).push(result);
    }
  }
  for (const edge of edges) {
    if (!cited(edge.sourceIds) || !names.has(edge.source) || !names.has(edge.target) || !readerField(edge,'evidence')) continue;
    for (const id of [edge.source,edge.target]) if (!firstLink.has(id)) firstLink.set(id,edge);
  }
  function entry(node) {
    if (Object.hasOwn(profiles,node.id) && cited(profiles[node.id].slice(1))) return profiles[node.id];
    if (node.electionResult?.sourceUpdatedAt && candidates.has(node.id)) {
      return candidateIntro(node,candidates.get(node.id),names);
    }
    const leaders = raceLeaders.get(node.id);
    if (leaders?.length === 1) {
      const result = leaders[0];
      const who = result.selectionCandidateIds.map(id => names.get(id)).join(' and ');
      const total = numbers.format(result.votes)+(result.selectionCandidateIds.length>1?' votes for their joint ticket':' votes');
      return [returnsLabel(result)+' from '+dates.format(new Date(result.sourceUpdatedAt))+' put '+who+' in the lead with '+total+'.', result.sourceId];
    }
    if (node.role === 'Named Flock financing participant' && node.sourceIds.includes('flock-financing-2025')) {
      return ['Flock Safety named '+node.name+' among the investors in its March 2025 financing round. The license plate camera company announced $275 million raised across all participants.', 'flock-financing-2025'];
    }
    if (node.role === 'Campaign-listed endorsing organization' && node.sourceIds.includes('pc26-acton-support')) {
      return ['Amy Acton’s campaign named '+node.name+' among the organizations endorsing her 2026 bid for Ohio governor on the joint ticket with David Pepper.', 'pc26-acton-support', 'pc26-ballot'];
    }
    const description = readerField(node,'description').trim();
    if (description) return [description,...node.sourceIds];
    return null;
  }
  const summaries = new Map();
  for (const node of nodes) {
    const line = entry(node);
    if (line && cited(line.slice(1))) {
      const [text,...sourceIds] = line;
      summaries.set(node.id,{text,sourceIds});
    } else if (firstLink.has(node.id)) {
      const edge = firstLink.get(node.id);
      summaries.set(node.id,{text:readerField(edge,'evidence'),sourceIds:edge.sourceIds,edge});
    }
  }
  return summaries;
}
