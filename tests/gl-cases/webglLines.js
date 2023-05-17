var $ = require('jquery');

describe('webglLines', function () {
  var imageTest = require('../image-test');
  var common = require('../test-common');

  var data = [
    {type: 'Feature', properties: {LINEARID: '110685800599', FULLNAME: 'N Midway St', RTTYP: 'M', MTFCC: 'S1200'}, geometry: {type: 'LineString', coordinates: [[-85.44966, 31.87798], [-85.44965, 31.87835], [-85.449649, 31.87841], [-85.449649, 31.878528], [-85.44965, 31.879264]]}},
    {type: 'Feature', properties: {LINEARID: '110685801299', FULLNAME: 'N Forsyth Ave', RTTYP: 'M', MTFCC: 'S1400'}, geometry: {type: 'LineString', coordinates: [[-85.13888, 31.892975], [-85.13886, 31.893222], [-85.13884, 31.89348], [-85.13883, 31.89374], [-85.13882, 31.893909]]}},
    {type: 'Feature', properties: {LINEARID: '110685801253', FULLNAME: 'N Eufaula Ave', RTTYP: 'M', MTFCC: 'S1200'}, geometry: {type: 'LineString', coordinates: [[-85.14578, 31.891373], [-85.14578, 31.891491], [-85.1458, 31.89168], [-85.14581, 31.892061], [-85.14583, 31.892229], [-85.14584, 31.89266], [-85.14584, 31.892933], [-85.14584, 31.893126], [-85.14583, 31.893351], [-85.14583, 31.893806], [-85.14585, 31.894073], [-85.14586, 31.89422], [-85.14585, 31.894365], [-85.14586, 31.894643], [-85.14587, 31.89479], [-85.14588, 31.894875], [-85.14589, 31.895292], [-85.14589, 31.895471], [-85.14589, 31.89562], [-85.14589, 31.89588], [-85.1459, 31.89678], [-85.1459, 31.89694], [-85.14591, 31.897065], [-85.14591, 31.897566], [-85.1459, 31.897934], [-85.1459, 31.89829], [-85.1459, 31.898602], [-85.1459, 31.898682], [-85.14591, 31.89928], [-85.14591, 31.89951], [-85.14594, 31.90016], [-85.14597, 31.90132], [-85.14598, 31.901471], [-85.146, 31.90198], [-85.14603, 31.902093], [-85.146063, 31.90221], [-85.14611, 31.902332], [-85.14622, 31.902535], [-85.1463, 31.902658], [-85.14649, 31.902986], [-85.14662, 31.903177], [-85.14681, 31.903419], [-85.14691, 31.90354], [-85.14701, 31.903648], [-85.147089, 31.903724], [-85.14727, 31.903883], [-85.14745, 31.90403], [-85.14778, 31.90427], [-85.14808, 31.904527], [-85.1483, 31.904747], [-85.14845, 31.90492], [-85.1486, 31.9051], [-85.14869, 31.905218], [-85.14886, 31.905469], [-85.14898, 31.90566], [-85.14909, 31.905869], [-85.1492, 31.90613], [-85.14929, 31.906386], [-85.14933, 31.90652], [-85.14938, 31.90675], [-85.14943, 31.906966], [-85.14946, 31.907181], [-85.14948, 31.907398], [-85.14948, 31.907488], [-85.14949, 31.907616], [-85.14948, 31.907907], [-85.14946, 31.90812], [-85.14943, 31.90834], [-85.1492, 31.909604], [-85.14917, 31.909784], [-85.14914, 31.909938], [-85.14908, 31.910215], [-85.14902, 31.910573], [-85.149, 31.910714], [-85.14898, 31.910803], [-85.14894, 31.911078], [-85.14891, 31.911224], [-85.14884, 31.911633], [-85.14879, 31.91196], [-85.14864, 31.912801], [-85.1486, 31.912945], [-85.14858, 31.91309], [-85.14818, 31.91526], [-85.14814, 31.91552], [-85.14799, 31.91631], [-85.14792, 31.916694], [-85.14787, 31.91695], [-85.14782, 31.9172], [-85.14773, 31.917631], [-85.14752, 31.91848], [-85.14748, 31.91863], [-85.14746, 31.9187], [-85.14745, 31.918766], [-85.14734, 31.91912], [-85.14733, 31.919187], [-85.14729, 31.919332], [-85.14704, 31.91996], [-85.14689, 31.92035], [-85.14676, 31.920684], [-85.1467, 31.920849], [-85.14662, 31.921026], [-85.14647, 31.92136], [-85.14631, 31.921703], [-85.14615, 31.922037], [-85.14607, 31.92218], [-85.14581, 31.922661], [-85.1455, 31.92321], [-85.14477, 31.924352], [-85.14466, 31.924503], [-85.14445, 31.924794], [-85.14435, 31.92494], [-85.14411, 31.92524], [-85.14363, 31.925848], [-85.14338, 31.926141], [-85.14261, 31.92701], [-85.14209, 31.927591], [-85.14125, 31.92855], [-85.14101, 31.928839], [-85.14078, 31.929143], [-85.140554, 31.929452], [-85.14034, 31.92977], [-85.14009, 31.930167], [-85.13982, 31.9306], [-85.13937, 31.93129], [-85.13917, 31.93161], [-85.13864, 31.93247], [-85.138166, 31.933225], [-85.13737, 31.93451], [-85.13655, 31.935808], [-85.13634, 31.936126], [-85.13611, 31.936432], [-85.13586, 31.93673], [-85.1356, 31.937016], [-85.13532, 31.937291], [-85.13503, 31.937559], [-85.13444, 31.938079], [-85.13233, 31.939904], [-85.1317, 31.940437], [-85.13151, 31.940611], [-85.13137, 31.940729], [-85.13098, 31.94107], [-85.13016, 31.94178], [-85.13009, 31.941845], [-85.12979, 31.94211], [-85.12951, 31.94238], [-85.12938, 31.94251], [-85.12923, 31.94266], [-85.12896, 31.94294], [-85.12869, 31.94323], [-85.12844, 31.94352], [-85.128192, 31.94382], [-85.12795, 31.94413], [-85.127725, 31.94444], [-85.1275, 31.94475], [-85.12729, 31.945067], [-85.12708, 31.94539], [-85.12689, 31.945716], [-85.12651, 31.946349], [-85.12621, 31.946857], [-85.12562, 31.947841], [-85.12543, 31.948171], [-85.12509, 31.948736], [-85.124933, 31.949003], [-85.12399, 31.95063], [-85.12343, 31.95162], [-85.12321, 31.95205], [-85.12308, 31.952317], [-85.12282, 31.95278], [-85.12246, 31.95344], [-85.12232, 31.95369], [-85.12228, 31.953768], [-85.12194, 31.95433], [-85.12048, 31.957], [-85.12017, 31.95761], [-85.12004, 31.95786], [-85.11998, 31.95801], [-85.11963, 31.95883], [-85.11936, 31.959523], [-85.11911, 31.96022], [-85.11903, 31.960407], [-85.11899, 31.96051], [-85.11897, 31.960563], [-85.11885, 31.96091], [-85.11862, 31.96161], [-85.11851, 31.96195], [-85.11845, 31.96213], [-85.11828, 31.96275], [-85.11823, 31.96291], [-85.11811, 31.963339], [-85.118, 31.96369], [-85.11787, 31.96404], [-85.11656, 31.96761], [-85.11621, 31.96857], [-85.11596, 31.96926], [-85.11585, 31.969618], [-85.115753, 31.969975], [-85.11567, 31.970334], [-85.11561, 31.97069], [-85.11555, 31.97106], [-85.11551, 31.97142], [-85.11542, 31.972148], [-85.11533, 31.97287], [-85.114717, 31.97796], [-85.11464, 31.97869], [-85.11461, 31.979057], [-85.114554, 31.97978], [-85.11453, 31.98015], [-85.11452, 31.98052], [-85.11451, 31.981828], [-85.1145, 31.982566], [-85.11449, 31.983262], [-85.11449, 31.983435], [-85.11448, 31.983801], [-85.11447, 31.98453], [-85.11449, 31.985262], [-85.11451, 31.985629], [-85.11454, 31.985992], [-85.11465, 31.987086], [-85.11469, 31.987612], [-85.11471, 31.98784], [-85.11477, 31.9883], [-85.11492, 31.989892], [-85.11498, 31.99044], [-85.1154, 31.99485], [-85.11562, 31.99703], [-85.11575, 31.99813], [-85.11579, 31.99849], [-85.11582, 31.99885], [-85.11598, 32.00051], [-85.11603, 32.00104], [-85.11609, 32.00154], [-85.116158, 32.00226], [-85.116323, 32.00399], [-85.11642, 32.00495], [-85.11658, 32.006636], [-85.11669, 32.007719], [-85.11672, 32.008082], [-85.11688, 32.009717], [-85.11748, 32.015946], [-85.11763, 32.017542], [-85.11767, 32.017905], [-85.11772, 32.018267], [-85.11779, 32.018628], [-85.11787, 32.018988], [-85.11795, 32.019348], [-85.11804, 32.019705], [-85.11815, 32.02006], [-85.1186, 32.02147], [-85.11883, 32.02217], [-85.119057, 32.022878], [-85.11974, 32.024991], [-85.11982, 32.025207], [-85.120004, 32.025723], [-85.12018, 32.026308], [-85.1203, 32.026663], [-85.12053, 32.027363], [-85.12066, 32.027712], [-85.1208, 32.028056], [-85.1211, 32.028737], [-85.12145, 32.029403], [-85.12153, 32.029533], [-85.12161, 32.029702], [-85.12173, 32.029919], [-85.12192, 32.030242], [-85.12347, 32.03293], [-85.12374, 32.033378], [-85.12465, 32.034967], [-85.12479, 32.035218], [-85.12536, 32.0362], [-85.12558, 32.036583], [-85.12574, 32.036856], [-85.12592, 32.037185], [-85.12631, 32.03784], [-85.12656, 32.03828], [-85.126875, 32.03882], [-85.12933, 32.043078], [-85.13031, 32.044787], [-85.13538, 32.05355], [-85.1369, 32.056176], [-85.13881, 32.05948], [-85.13936, 32.06043], [-85.13975, 32.06108], [-85.14013, 32.06174], [-85.14038, 32.062173]]}},
    {type: 'Feature', properties: {LINEARID: '110685800601', FULLNAME: 'N Midway St', RTTYP: 'M', MTFCC: 'S1200'}, geometry: {type: 'LineString', coordinates: [[-85.44965, 31.879264], [-85.44966, 31.88007], [-85.44966, 31.881092], [-85.44964, 31.882305], [-85.44963, 31.883703], [-85.44965, 31.883916], [-85.44972, 31.884046], [-85.44983, 31.884147], [-85.44999, 31.884199], [-85.45015, 31.88421], [-85.45072, 31.88421], [-85.45103, 31.884211], [-85.45222, 31.884232], [-85.45242, 31.884241], [-85.45257, 31.88425], [-85.45282, 31.88425], [-85.45375, 31.88426], [-85.45406, 31.88427], [-85.45526, 31.884274], [-85.4562, 31.88428], [-85.45645, 31.8843], [-85.4568, 31.884328], [-85.45736, 31.884401], [-85.45754, 31.88443], [-85.45783, 31.88448], [-85.45854, 31.8846], [-85.45879, 31.88464], [-85.45898, 31.88467], [-85.4592, 31.88471], [-85.459458, 31.88476], [-85.45971, 31.88482], [-85.46017, 31.88497], [-85.46039, 31.88503], [-85.46069, 31.88515], [-85.4609, 31.885218]]}},
    {type: 'Feature', properties: {LINEARID: '110685799471', FULLNAME: 'N Main St', RTTYP: 'M', MTFCC: 'S1200'}, geometry: {type: 'LineString', coordinates: [[-85.55372, 31.78642], [-85.55322, 31.78721], [-85.55247, 31.78835], [-85.55202, 31.78903], [-85.55158, 31.789694], [-85.55107, 31.79044], [-85.55095, 31.79063], [-85.55083, 31.79082], [-85.55074, 31.79102], [-85.55069, 31.79116], [-85.55066, 31.79128], [-85.55067, 31.79138], [-85.55064, 31.7916], [-85.55064, 31.79182], [-85.55068, 31.79248], [-85.55078, 31.79379], [-85.55083, 31.79445], [-85.5509, 31.795542], [-85.55092, 31.79576], [-85.55092, 31.795963], [-85.55092, 31.79628], [-85.55089, 31.79654], [-85.55088, 31.7967], [-85.55078, 31.79765], [-85.55077, 31.79772], [-85.55076, 31.79785], [-85.55068, 31.798595], [-85.55067, 31.79873], [-85.55062, 31.79923], [-85.55041, 31.80122], [-85.55034, 31.801874], [-85.5503, 31.80224], [-85.55027, 31.80253], [-85.55017, 31.8034], [-85.55009, 31.80383], [-85.54999, 31.80421], [-85.54997, 31.80426], [-85.54982, 31.80468], [-85.54963, 31.805091], [-85.54941, 31.805485], [-85.54916, 31.805866], [-85.54887, 31.80623], [-85.54879, 31.80632], [-85.54856, 31.80658], [-85.54822, 31.80691], [-85.54786, 31.807216], [-85.54746, 31.8075], [-85.54705, 31.80776], [-85.54662, 31.808], [-85.54617, 31.80821], [-85.54562, 31.80842], [-85.54543, 31.808492]]}},
    {type: 'Feature', properties: {LINEARID: '110685802080', FULLNAME: 'N Randolph Ave', RTTYP: 'M', MTFCC: 'S1400'}, geometry: {type: 'LineString', coordinates: [[-85.14399, 31.89295], [-85.144, 31.893158], [-85.144, 31.893427], [-85.14404, 31.894557], [-85.14405, 31.8953], [-85.14405, 31.895853], [-85.14406, 31.897104], [-85.14406, 31.8973], [-85.14406, 31.897371], [-85.14406, 31.898323], [-85.14412, 31.901977], [-85.14412, 31.902186], [-85.14402, 31.902336], [-85.14392, 31.90221], [-85.14391, 31.901983], [-85.14391, 31.901789], [-85.143903, 31.900629], [-85.14387, 31.89831], [-85.14386, 31.89738], [-85.14385, 31.89725], [-85.14386, 31.897102], [-85.14383, 31.895858], [-85.14383, 31.895244], [-85.14382, 31.894564], [-85.14383, 31.893962], [-85.14384, 31.893885], [-85.14385, 31.893595], [-85.14383, 31.89316], [-85.14383, 31.892945], [-85.14382, 31.891973], [-85.14381, 31.89152], [-85.1438, 31.8914]]}},
    {type: 'Feature', properties: {LINEARID: '110685800668', FULLNAME: 'N Orange Ave', RTTYP: 'M', MTFCC: 'S1400'}, geometry: {type: 'LineString', coordinates: [[-85.14211, 31.89459], [-85.14212, 31.894835], [-85.14212, 31.89498], [-85.14211, 31.89524], [-85.1421, 31.895558], [-85.1421, 31.895889], [-85.14211, 31.89632], [-85.14211, 31.896511], [-85.14211, 31.897369], [-85.1421, 31.898472], [-85.14209, 31.899086], [-85.14208, 31.89933], [-85.14208, 31.89943], [-85.14207, 31.899838], [-85.142072, 31.9003], [-85.142072, 31.900603], [-85.14207, 31.90107], [-85.14208, 31.901142], [-85.14211, 31.90121], [-85.14216, 31.901267], [-85.1422, 31.9013]]}},
    {type: 'Feature', properties: {LINEARID: '110685800669', FULLNAME: 'N Orange Ave', RTTYP: 'M', MTFCC: 'S1400'}, geometry: {type: 'LineString', coordinates: [[-85.14219, 31.89296], [-85.14219, 31.893173], [-85.14218, 31.89349], [-85.14218, 31.893637], [-85.14217, 31.894472], [-85.14211, 31.89459]]}},
    {type: 'Feature', properties: {LINEARID: '110685800245', FULLNAME: 'N Armory St', RTTYP: 'M', MTFCC: 'S1400'}, geometry: {type: 'LineString', coordinates: [[-85.44422, 31.87817], [-85.44421, 31.879314], [-85.44418, 31.8806], [-85.44419, 31.88079], [-85.44416, 31.882102], [-85.44417, 31.882188], [-85.44419, 31.882257], [-85.44422, 31.88231], [-85.44427, 31.88238]]}},
    {type: 'Feature', properties: {LINEARID: '110685801300', FULLNAME: 'N Forsyth Ave', RTTYP: 'M', MTFCC: 'S1400'}, geometry: {type: 'LineString', coordinates: [[-85.13881, 31.891449], [-85.13881, 31.891572], [-85.13882, 31.892216], [-85.13882, 31.892363], [-85.13884, 31.89282], [-85.13888, 31.892975]]}},
    {type: 'Feature', properties: {LINEARID: '110685802791', FULLNAME: 'N Livingston Ave', RTTYP: 'M', MTFCC: 'S1400'}, geometry: {type: 'LineString', coordinates: [[-85.1407, 31.891434], [-85.14073, 31.891561], [-85.14074, 31.891753], [-85.14076, 31.892764], [-85.14074, 31.892981], [-85.14073, 31.893186], [-85.14071, 31.89356], [-85.14069, 31.89457], [-85.14069, 31.894641]]}},
    {type: 'Feature', properties: {LINEARID: '110685801301', FULLNAME: 'N Forsyth Ave', RTTYP: 'M', MTFCC: 'S1400'}, geometry: {type: 'LineString', coordinates: [[-85.13895, 31.89145], [-85.13894, 31.891573], [-85.13895, 31.892189], [-85.13895, 31.892575], [-85.13894, 31.892809], [-85.13888, 31.892975]]}},
    {type: 'Feature', properties: {LINEARID: '110685799403', FULLNAME: 'N Keen St', RTTYP: 'M', MTFCC: 'S1400'}, geometry: {type: 'LineString', coordinates: [[-85.44104, 31.879337], [-85.44095, 31.880336], [-85.44094, 31.880557]]}},
    {type: 'Feature', properties: {LINEARID: '110685799592', FULLNAME: 'N Witt Ln', RTTYP: 'M', MTFCC: 'S1400'}, geometry: {type: 'LineString', coordinates: [[-85.44839, 31.879268], [-85.44839, 31.879097], [-85.4484, 31.879025], [-85.4484, 31.878952], [-85.4484, 31.878447], [-85.4484, 31.878146], [-85.44839, 31.877769], [-85.44839, 31.877592], [-85.44839, 31.877321]]}},
    {type: 'Feature', properties: {LINEARID: '110685801252', FULLNAME: 'N Eufaula Ave', RTTYP: 'M', MTFCC: 'S1200'}, geometry: {type: 'LineString', coordinates: [[-85.14563, 31.89138], [-85.14564, 31.89149], [-85.14564, 31.89165], [-85.14565, 31.8918], [-85.14566, 31.892936], [-85.14566, 31.893137], [-85.14566, 31.89392], [-85.14565, 31.8945], [-85.14566, 31.894578], [-85.145648, 31.8948], [-85.14565, 31.89529], [-85.14566, 31.89562], [-85.14568, 31.896552], [-85.14569, 31.897067], [-85.14572, 31.898291], [-85.14573, 31.89875], [-85.1458, 31.90121], [-85.14582, 31.901875], [-85.14584, 31.902019], [-85.14586, 31.90208], [-85.14591, 31.902217], [-85.14596, 31.902331], [-85.146104, 31.902609], [-85.14632, 31.903005], [-85.14657, 31.90338], [-85.14671, 31.90356], [-85.14688, 31.90375], [-85.146982, 31.90384], [-85.1471, 31.903946], [-85.14722, 31.904048], [-85.14735, 31.90415], [-85.14755, 31.904286], [-85.14774, 31.904432], [-85.14797, 31.90463], [-85.148102, 31.904755], [-85.14837, 31.905042], [-85.14851, 31.90522], [-85.14869, 31.905473], [-85.14881, 31.905667], [-85.14891, 31.90585], [-85.14902, 31.90607], [-85.1491, 31.906279], [-85.14917, 31.906491], [-85.14919, 31.906583], [-85.14928, 31.906919], [-85.14934, 31.907426], [-85.14934, 31.907792], [-85.14932, 31.90801], [-85.14921, 31.908732], [-85.14905, 31.909521], [-85.14881, 31.910772], [-85.14873, 31.911314], [-85.14867, 31.911649], [-85.14865, 31.91176], [-85.14862, 31.911909], [-85.14854, 31.91226], [-85.14842, 31.91296], [-85.14833, 31.913475], [-85.14796, 31.91551], [-85.14784, 31.91607], [-85.1478, 31.91628], [-85.147684, 31.916948], [-85.1476, 31.91743], [-85.147515, 31.917788], [-85.14735, 31.91843], [-85.14733, 31.91849], [-85.14731, 31.91857], [-85.14707, 31.91934], [-85.14684, 31.91991], [-85.14664, 31.92049], [-85.14651, 31.920805], [-85.14637, 31.92114], [-85.14605, 31.921818], [-85.14587, 31.92215], [-85.14585, 31.92218], [-85.14561, 31.922609], [-85.14462, 31.924201], [-85.14441, 31.9245], [-85.14427, 31.92469], [-85.14402, 31.92503], [-85.14378, 31.92533], [-85.14354, 31.92563], [-85.14303, 31.92622], [-85.14122, 31.92826], [-85.14097, 31.92855], [-85.14073, 31.92886], [-85.1405, 31.929165], [-85.14028, 31.92948], [-85.14007, 31.929793], [-85.13966, 31.930433], [-85.13862, 31.932112], [-85.13843, 31.93241], [-85.13722, 31.934342], [-85.13665, 31.93527], [-85.13624, 31.935907], [-85.13601, 31.936218], [-85.13577, 31.936521], [-85.13551, 31.936812], [-85.13524, 31.937092], [-85.13495, 31.937361], [-85.13465, 31.937623], [-85.13285, 31.93918], [-85.13195, 31.939957], [-85.1312, 31.940599], [-85.13084, 31.940919], [-85.13014, 31.94152], [-85.12996, 31.94168], [-85.12984, 31.94178], [-85.12955, 31.94205], [-85.12927, 31.942324], [-85.12919, 31.942399], [-85.12899, 31.9426], [-85.12872, 31.94289], [-85.12846, 31.943173], [-85.12821, 31.94347], [-85.127967, 31.943767], [-85.12773, 31.94407], [-85.1275, 31.94438], [-85.12728, 31.94469], [-85.12707, 31.94501], [-85.12667, 31.945653], [-85.1257, 31.947278], [-85.12489, 31.948654], [-85.12415, 31.94989], [-85.12378, 31.95054], [-85.12295, 31.95204], [-85.12232, 31.95319], [-85.12213, 31.953517], [-85.12193, 31.95384], [-85.12172, 31.95424], [-85.12149, 31.954715], [-85.12004, 31.957364], [-85.1197, 31.95802], [-85.11941, 31.958719], [-85.11927, 31.959065], [-85.11876, 31.96046], [-85.11874, 31.960509], [-85.11865, 31.96075], [-85.11853, 31.961102], [-85.11841, 31.96145], [-85.11828, 31.961799], [-85.11821, 31.962078], [-85.1181, 31.962586], [-85.11791, 31.9633], [-85.11781, 31.963655], [-85.1177, 31.96401], [-85.11758, 31.96436], [-85.11707, 31.965755], [-85.11656, 31.967148], [-85.1163, 31.96785], [-85.11604, 31.968543], [-85.11592, 31.96889], [-85.1158, 31.969242], [-85.11568, 31.969594], [-85.11559, 31.969948], [-85.115505, 31.970308], [-85.11544, 31.970667], [-85.11539, 31.97103], [-85.11508, 31.973574], [-85.11482, 31.97576], [-85.11473, 31.976484], [-85.11464, 31.97721], [-85.11452, 31.978301], [-85.114443, 31.979029], [-85.11441, 31.97939], [-85.11437, 31.980122], [-85.11435, 31.980853], [-85.11433, 31.98176], [-85.11432, 31.982312], [-85.11432, 31.982587], [-85.11432, 31.983041], [-85.11432, 31.98323], [-85.114295, 31.984865], [-85.11431, 31.98559], [-85.11433, 31.98596], [-85.11435, 31.98632], [-85.11442, 31.987049], [-85.11447, 31.987598], [-85.11452, 31.988143], [-85.1147, 31.989963], [-85.11474, 31.990402], [-85.11501, 31.99323], [-85.11552, 31.998318], [-85.11573, 32.000543], [-85.11577, 32.000934], [-85.11583, 32.001567], [-85.116, 32.003414], [-85.11606, 32.003993], [-85.11616, 32.004967], [-85.11621, 32.00559], [-85.11636, 32.00705], [-85.11661, 32.00972], [-85.11677, 32.011414], [-85.11691, 32.01287], [-85.11705, 32.014324], [-85.11719, 32.015779], [-85.11733, 32.017234], [-85.11737, 32.017595], [-85.11741, 32.017958], [-85.11747, 32.018321], [-85.11753, 32.01868], [-85.11761, 32.01904], [-85.11769, 32.0194], [-85.11779, 32.01975], [-85.11789, 32.020108], [-85.11856, 32.02222], [-85.11953, 32.02521], [-85.119704, 32.02573], [-85.11981, 32.02609], [-85.11993, 32.026437], [-85.11998, 32.02661], [-85.1201, 32.026986], [-85.12032, 32.02759], [-85.12046, 32.02793], [-85.1206, 32.028275], [-85.12091, 32.02895], [-85.12101, 32.029125], [-85.1213, 32.02968], [-85.12136, 32.02978], [-85.12145, 32.029935], [-85.12296, 32.032553], [-85.12349, 32.03347], [-85.12372, 32.03386], [-85.12435, 32.03496], [-85.12515, 32.03635], [-85.12531, 32.03662], [-85.12625, 32.03825], [-85.12633, 32.038393], [-85.12643, 32.038604], [-85.12662, 32.038933], [-85.12871, 32.042543], [-85.13002, 32.044804], [-85.13117, 32.046796], [-85.13249, 32.049087], [-85.13704, 32.056955], [-85.13816, 32.05893], [-85.13843, 32.05937], [-85.14007, 32.06218]]}},
    {type: 'Feature', properties: {LINEARID: '110685800670', FULLNAME: 'N Orange Ave', RTTYP: 'M', MTFCC: 'S1400'}, geometry: {type: 'LineString', coordinates: [[-85.14203, 31.892963], [-85.14202, 31.89317], [-85.14204, 31.894324], [-85.14203, 31.89447], [-85.14211, 31.89459]]}},
    {type: 'Feature', properties: {LINEARID: '110685801264', FULLNAME: 'S Eufaula Ave', RTTYP: 'M', MTFCC: 'S1200'}, geometry: {type: 'LineString', coordinates: [[-85.27605, 31.70433], [-85.27601, 31.704426], [-85.27583, 31.704919], [-85.27562, 31.70554], [-85.27555, 31.70568], [-85.27492, 31.70742], [-85.27475, 31.707913], [-85.2747, 31.70802], [-85.27465, 31.70819], [-85.27437, 31.70895], [-85.27435, 31.70902], [-85.27427, 31.709223], [-85.27341, 31.711597], [-85.27333, 31.71181], [-85.27317, 31.712295], [-85.27289, 31.71306], [-85.27253, 31.71396], [-85.27213, 31.7148], [-85.27208, 31.71491], [-85.27201, 31.715039], [-85.27199, 31.715108], [-85.27192, 31.715232], [-85.27184, 31.71536], [-85.2718, 31.71542], [-85.27176, 31.71549], [-85.27171, 31.715558], [-85.27159, 31.715753], [-85.27109, 31.716514], [-85.27055, 31.717254], [-85.27005, 31.717852], [-85.26941, 31.71854], [-85.26856, 31.71936], [-85.26832, 31.719572], [-85.26783, 31.719977], [-85.26765, 31.72012], [-85.2676, 31.720174], [-85.26751, 31.72023], [-85.26681, 31.72079], [-85.26665, 31.720919], [-85.26658, 31.72097], [-85.26579, 31.721606], [-85.26453, 31.722613], [-85.264417, 31.722722], [-85.26405, 31.72302], [-85.26393, 31.72311], [-85.26384, 31.723169], [-85.26309, 31.723772], [-85.263, 31.723856], [-85.26281, 31.724001], [-85.262402, 31.72434], [-85.26231, 31.724399], [-85.25924, 31.726854], [-85.25888, 31.727146], [-85.25777, 31.72805], [-85.25695, 31.728794], [-85.25639, 31.729418], [-85.25624, 31.729596], [-85.25596, 31.729954], [-85.25468, 31.73186], [-85.25393, 31.733012], [-85.25216, 31.735679], [-85.25163, 31.736432], [-85.25141, 31.7367], [-85.25083, 31.737371], [-85.2504, 31.737812], [-85.25016, 31.738023], [-85.2498, 31.73833], [-85.24961, 31.73848], [-85.24871, 31.7391], [-85.24741, 31.739884], [-85.24508, 31.74127], [-85.24486, 31.74139], [-85.24467, 31.741505], [-85.24458, 31.741561], [-85.24362, 31.74213], [-85.24356, 31.74218], [-85.243445, 31.74224], [-85.24315, 31.742427], [-85.24301, 31.742507], [-85.24295, 31.742548], [-85.2429, 31.742574], [-85.24279, 31.74263], [-85.24075, 31.74384], [-85.23968, 31.74444], [-85.23939, 31.7446], [-85.23777, 31.74542], [-85.2365, 31.74599], [-85.23642, 31.74602], [-85.23484, 31.74674], [-85.23464, 31.74684], [-85.23454, 31.746874], [-85.2327, 31.7477], [-85.2325, 31.74779], [-85.23114, 31.748398], [-85.231, 31.74848], [-85.23026, 31.748809], [-85.23015, 31.74884], [-85.22826, 31.749693], [-85.22819, 31.749732], [-85.2275, 31.750039], [-85.22742, 31.75007], [-85.22719, 31.750173], [-85.22687, 31.750309], [-85.2267, 31.750398], [-85.223306, 31.751923], [-85.22324, 31.751959], [-85.22279, 31.752164], [-85.22272, 31.7522], [-85.22255, 31.75226], [-85.22244, 31.75231], [-85.222167, 31.752431], [-85.2196, 31.753588], [-85.21855, 31.754054], [-85.21837, 31.754138], [-85.2175, 31.754532], [-85.21705, 31.754731], [-85.21637, 31.755044], [-85.21456, 31.755857], [-85.21433, 31.755964], [-85.21418, 31.75604], [-85.21381, 31.756206], [-85.21368, 31.756267], [-85.21358, 31.756296], [-85.21351, 31.756327], [-85.21275, 31.756669], [-85.2117, 31.757157], [-85.21118, 31.757408], [-85.21082, 31.7576], [-85.21042, 31.75779], [-85.21028, 31.757873], [-85.2102, 31.757912], [-85.20999, 31.75803], [-85.20681, 31.75972], [-85.20667, 31.75981], [-85.20566, 31.760347], [-85.20551, 31.76043], [-85.20536, 31.760491], [-85.20028, 31.7632], [-85.19947, 31.763633], [-85.19936, 31.763692], [-85.198859, 31.763971], [-85.19791, 31.764472], [-85.19774, 31.764557], [-85.19761, 31.764618], [-85.19551, 31.765736], [-85.19398, 31.766536], [-85.19384, 31.766616], [-85.19282, 31.767135], [-85.19268, 31.767198], [-85.192011, 31.767541], [-85.19194, 31.767583], [-85.19165, 31.76773], [-85.19076, 31.76816], [-85.19059, 31.768265], [-85.19044, 31.768344], [-85.18898, 31.769091], [-85.188251, 31.769475], [-85.18775, 31.769759], [-85.18613, 31.770825], [-85.18491, 31.77165]]}},
    {type: 'Feature', properties: {LINEARID: '110685801256', FULLNAME: 'S Eufaula Ave', RTTYP: 'M', MTFCC: 'S1200'}, geometry: {type: 'LineString', coordinates: [[-85.16316, 31.82653], [-85.16318, 31.82668], [-85.16322, 31.826823]]}},
    {type: 'Feature', properties: {LINEARID: '110685801267', FULLNAME: 'S Eufaula Ave', RTTYP: 'M', MTFCC: 'S1200'}, geometry: {type: 'LineString', coordinates: [[-85.16419, 31.83086], [-85.16465, 31.83279], [-85.1647, 31.83297], [-85.16511, 31.83468], [-85.16519, 31.83512], [-85.16525, 31.835335], [-85.16534, 31.83568], [-85.16543, 31.836075], [-85.165459, 31.836179], [-85.16558, 31.836673], [-85.16575, 31.83741], [-85.16578, 31.837567], [-85.16586, 31.837898], [-85.16587, 31.837968], [-85.16595, 31.83822], [-85.16627, 31.839578], [-85.16635, 31.839918], [-85.16656, 31.840836], [-85.16672, 31.84143], [-85.1668, 31.84171], [-85.16709, 31.842925], [-85.167121, 31.843067], [-85.16718, 31.843353], [-85.16731, 31.84415], [-85.16734, 31.844454], [-85.16735, 31.844587], [-85.16739, 31.84495], [-85.1674, 31.84517], [-85.16741, 31.845534], [-85.16742, 31.84582], [-85.16741, 31.845966], [-85.16741, 31.846229], [-85.16739, 31.846744], [-85.167352, 31.847182], [-85.16725, 31.84797], [-85.16702, 31.849758], [-85.16685, 31.851015], [-85.166834, 31.851153], [-85.16661, 31.85283], [-85.166579, 31.853054], [-85.16654, 31.85341], [-85.16653, 31.85346], [-85.1665, 31.85363], [-85.1665, 31.85371], [-85.16649, 31.853759], [-85.16639, 31.85451], [-85.16637, 31.854654], [-85.16635, 31.854872], [-85.16633, 31.85494], [-85.16632, 31.85506], [-85.16624, 31.85567], [-85.16624, 31.855806], [-85.16618, 31.85624], [-85.16614, 31.85644], [-85.16609, 31.856833], [-85.16603, 31.85716], [-85.16598, 31.857546], [-85.16593, 31.85799], [-85.16583, 31.858781], [-85.1658, 31.858924], [-85.16571, 31.859375], [-85.16562, 31.859722], [-85.16544, 31.860286], [-85.16531, 31.860598], [-85.16524, 31.860759], [-85.16508, 31.8611], [-85.164898, 31.861432], [-85.1647, 31.861756], [-85.16453, 31.86201], [-85.16422, 31.86245], [-85.16382, 31.862921], [-85.16308, 31.863723], [-85.16304, 31.86378], [-85.16292, 31.86389], [-85.16182, 31.865096], [-85.16108, 31.865902], [-85.16077, 31.866244], [-85.16024, 31.866814], [-85.16003, 31.867044], [-85.15993, 31.86716], [-85.15961, 31.867503], [-85.15945, 31.867677], [-85.15939, 31.867734], [-85.15912, 31.868016], [-85.15889, 31.868239], [-85.15873, 31.8684], [-85.1584, 31.86874], [-85.15819, 31.86897], [-85.15816, 31.86909]]}},
    {type: 'Feature', properties: {LINEARID: '110685802088', FULLNAME: 'S Randolph Ave', RTTYP: 'M', MTFCC: 'S1400'}, geometry: {type: 'LineString', coordinates: [[-85.14956, 31.86662], [-85.14918, 31.867135], [-85.14896, 31.867445], [-85.14885, 31.86758], [-85.14859, 31.86795], [-85.14845, 31.86814], [-85.14805, 31.868694], [-85.14783, 31.869], [-85.1477, 31.86918], [-85.1476, 31.86934], [-85.14746, 31.86955], [-85.14708, 31.87013], [-85.14694, 31.87036], [-85.14662, 31.87088], [-85.14636, 31.871309], [-85.1456, 31.87261], [-85.14546, 31.87284], [-85.14493, 31.87373], [-85.14487, 31.873836], [-85.14467, 31.87419], [-85.14447, 31.874645], [-85.14446, 31.87466], [-85.14443, 31.87475], [-85.14436, 31.874976], [-85.144318, 31.875226], [-85.14427, 31.87574], [-85.14426, 31.87625], [-85.14426, 31.87637], [-85.14424, 31.87763], [-85.14418, 31.879397], [-85.14418, 31.88081], [-85.14416, 31.881752], [-85.14416, 31.88196], [-85.14416, 31.88219], [-85.14415, 31.882724], [-85.14414, 31.88322], [-85.14412, 31.883677], [-85.14413, 31.883894], [-85.14411, 31.884175], [-85.14411, 31.8844], [-85.14411, 31.88462], [-85.14409, 31.88485], [-85.144089, 31.88506], [-85.14407, 31.88558], [-85.14406, 31.88607], [-85.14405, 31.88637], [-85.14402, 31.886671], [-85.14402, 31.886792], [-85.144, 31.88705], [-85.143965, 31.887783], [-85.14395, 31.888292], [-85.14395, 31.88855], [-85.14393, 31.88935], [-85.14392, 31.89016], [-85.14392, 31.890266], [-85.14389, 31.890878]]}},
    {type: 'Feature', properties: {LINEARID: '110685801266', FULLNAME: 'S Eufaula Ave', RTTYP: 'M', MTFCC: 'S1200'}, geometry: {type: 'LineString', coordinates: [[-85.16438, 31.83083], [-85.16484, 31.832737], [-85.16487, 31.83292], [-85.16518, 31.834204], [-85.16524, 31.83441], [-85.16543, 31.835196], [-85.16544, 31.835277], [-85.16548, 31.835415], [-85.16555, 31.8357], [-85.16556, 31.835746], [-85.16559, 31.83584], [-85.16577, 31.83662], [-85.16581, 31.836769], [-85.16599, 31.83752], [-85.16601, 31.837639], [-85.16603, 31.837702], [-85.1661, 31.83799], [-85.16633, 31.83891], [-85.16652, 31.839698], [-85.16656, 31.839881], [-85.1667, 31.840484], [-85.16676, 31.840698], [-85.16676, 31.840779], [-85.16679, 31.840847], [-85.16681, 31.84093], [-85.1669, 31.84127], [-85.16691, 31.84137], [-85.166973, 31.84158], [-85.16702, 31.84178], [-85.167114, 31.842137], [-85.16715, 31.842295], [-85.16718, 31.842345], [-85.16726, 31.842702], [-85.16726, 31.842781], [-85.1673, 31.84293], [-85.16731, 31.843002], [-85.16733, 31.843066], [-85.16742, 31.84357], [-85.16753, 31.84423], [-85.16753, 31.844337], [-85.16755, 31.844441], [-85.16755, 31.844474], [-85.167581, 31.844817], [-85.16761, 31.845252], [-85.16762, 31.84576], [-85.16763, 31.84604], [-85.16763, 31.84628], [-85.16762, 31.84655], [-85.16757, 31.84706], [-85.16755, 31.847205], [-85.16746, 31.84797], [-85.16743, 31.84823], [-85.16724, 31.84967], [-85.16704, 31.85118], [-85.16682, 31.85283], [-85.16673, 31.8535], [-85.16671, 31.853676], [-85.16669, 31.85377], [-85.1665, 31.85525], [-85.16636, 31.856318], [-85.16634, 31.85646], [-85.16627, 31.85697], [-85.16625, 31.85715], [-85.16618, 31.857644], [-85.16614, 31.857985], [-85.16612, 31.858157], [-85.16609, 31.858447], [-85.16607, 31.858592], [-85.16602, 31.858938], [-85.1659, 31.859434], [-85.16584, 31.859645], [-85.16578, 31.859855], [-85.1657, 31.860137], [-85.16565, 31.860276], [-85.16559, 31.860409], [-85.16551, 31.8606], [-85.16544, 31.86076], [-85.16518, 31.86129], [-85.16491, 31.86175], [-85.16462, 31.86219], [-85.16429, 31.86261], [-85.16393, 31.863019], [-85.16357, 31.86342], [-85.1632, 31.86382], [-85.16309, 31.86394], [-85.16188, 31.865265], [-85.1612, 31.866002], [-85.15964, 31.867699], [-85.15929, 31.86809], [-85.15913, 31.86826], [-85.158958, 31.86842], [-85.15879, 31.868586], [-85.15862, 31.86875], [-85.15849, 31.86887], [-85.15827, 31.86905], [-85.15816, 31.86909]]}},
    {type: 'Feature', properties: {LINEARID: '110685801303', FULLNAME: 'S Forsyth Ave', RTTYP: 'M', MTFCC: 'S1400'}, geometry: {type: 'LineString', coordinates: [[-85.13868, 31.885637], [-85.1387, 31.885772], [-85.13872, 31.8859], [-85.13874, 31.886024], [-85.13873, 31.886279]]}},
    {type: 'Feature', properties: {LINEARID: '110685801283', FULLNAME: 'S Eufaula Ave', RTTYP: 'M', MTFCC: 'S1400'}, geometry: {type: 'LineString', coordinates: [[-85.1648, 31.799822], [-85.163703, 31.799604]]}},
    {type: 'Feature', properties: {LINEARID: '110685800610', FULLNAME: 'S Midway St', RTTYP: 'M', MTFCC: 'S1200'}, geometry: {type: 'LineString', coordinates: [[-85.44973, 31.87613], [-85.44971, 31.876317], [-85.4497, 31.876449]]}},
    {type: 'Feature', properties: {LINEARID: '110685801265', FULLNAME: 'S Eufaula Ave', RTTYP: 'M', MTFCC: 'S1200'}, geometry: {type: 'LineString', coordinates: [[-85.15816, 31.86909], [-85.15806, 31.86918], [-85.15796, 31.86931], [-85.15783, 31.86945], [-85.15752, 31.86977], [-85.15701, 31.870255], [-85.1564, 31.87087], [-85.15622, 31.87103], [-85.15601, 31.87123], [-85.15534, 31.871922], [-85.15468, 31.87258], [-85.15391, 31.87336], [-85.1534, 31.8739], [-85.15316, 31.874155], [-85.15299, 31.874324], [-85.15237, 31.87494], [-85.15199, 31.87533], [-85.15105, 31.87628], [-85.1508, 31.87653], [-85.15056, 31.87677], [-85.15028, 31.87706], [-85.15018, 31.87718], [-85.14964, 31.87771], [-85.1494, 31.87792], [-85.14873, 31.87859], [-85.14824, 31.87908], [-85.14779, 31.879528], [-85.14747, 31.87986], [-85.14732, 31.88004], [-85.14679, 31.88074]]}}
  ];

  var ReferenceLineData = [
    [[-86.00, 31.5], [-86.00, 32.3]], [[-86.00, 32.3], [-85.95, 32.3]], [[-85.95, 32.3], [-85.95, 31.5]],
    [[-85.85, 31.5], [-85.80, 32.3]], [[-85.80, 32.3], [-85.75, 31.5]], [[-85.75, 31.5], [-85.70, 32.3]],
    [[-85.65, 31.6], [-85.60, 32.0]], [[-85.60, 32.0], [-85.55, 31.6]],
    [[-85.45, 31.6], [-85.45, 31.8]], [[-85.45, 31.8], [-85.40, 31.6]], [[-85.40, 31.6], [-85.40, 31.8]],
    [[-85.30, 31.8], [-85.275, 32.0]], [[-85.275, 32.0], [-85.25, 31.8]],
    [[-85.15, 31.5], [-85.15, 32.3]],
    [[-85.00, 31.5], [-85.00, 31.9]], [[-85.00, 31.9], [-85.00, 32.3]],
    [[-84.85, 31.5], [-84.75, 31.9]], [[-84.75, 31.9], [-84.85, 32.3]]
  ];

  var LineData = [
    [[-86.00, 31.5], [-86.00, 32.3], [-85.95, 32.3], [-85.95, 31.5]],
    [[-85.85, 31.5], [-85.80, 32.3], [-85.75, 31.5], [-85.70, 32.3]],
    [[-85.65, 31.6], [-85.60, 32.0], [-85.55, 31.6]],
    [[-85.45, 31.6], [-85.45, 31.8], [-85.40, 31.6], [-85.40, 31.8]],
    [[-85.30, 31.8], [-85.275, 32.0], [-85.25, 31.8]],
    [[-85.15, 31.5], [-85.15, 32.3]],
    [[-85.00, 31.5], [-85.00, 31.9], [-85.00, 32.3]],
    [[-84.85, 31.5], [-84.75, 31.9], [-84.85, 32.3]]
  ];

  var myMap;

  beforeEach(function () {
    imageTest.prepareImageTest();
  });

  afterEach(function () {
    myMap.exit();
  });

  it('lines', function (done) {
    var mapOptions = {center: {x: -85.44956, y: 31.87798}, zoom: 10};
    myMap = common.createOsmMap(mapOptions, {}, true);

    var layer = myMap.createLayer('feature');
    var style = {
      strokeColor: {r: 1, g: 0.2, b: 0},
      strokeWidth: 2.0
    };

    layer.createFeature('line')
         .data(data)
         .line(function (d) { return d.geometry.coordinates; })
         .position(function (d, index, d2, index2) {
           return {x: d[0], y: d[1]};
         })
         .style(style);
    myMap.draw();

    imageTest.imageTest('webglLines', null, 0.0015, done, myMap.onIdle, 0, 2);
  }, 30000);

  it('lines with different options', function (done) {
    var mapOptions = {center: {x: -85.44956, y: 31.87798}, zoom: 9};
    myMap = common.createOsmMap(mapOptions, {}, true);

    var layer = myMap.createLayer('feature', {renderer: 'webgl'});
    var baseStyle = {
      antialiasing: 2,
      miterLimit: 5
    };

    layer.createFeature('line', {style: baseStyle})
      .data(LineData)
      .line(function (d) {
        return d;
      })
      .position(function (d, index, item, itemIdx) {
        return {x: d[0], y: d[1]};
      })
      .style($.extend({
        lineCap: function (d, i, line, idx) {
          return ['butt', 'round', 'square'][idx % 3];
        },
        lineJoin: function (d, i, line, idx) {
          return ['miter', 'bevel', 'round', 'miter-clip'][idx % 4];
        },
        strokeColor: 'black',
        strokeWidth: function (d, i, line, idx) {
          if (idx === 6) {
            return i === 1 ? 12 : 24;
          }
          return 24;
        },
        strokeOpacity: 0.5,
        strokeOffset: function (d, i, line, idx) {
          return idx === 2 ? -0.5 : 0;
        },
        closed: false
      }, baseStyle));
    layer.createFeature('line', {style: baseStyle})
      .data(ReferenceLineData)
      .line(function (d) {
        return d;
      })
      .position(function (d, index, item, itemIdx) {
        return {x: d[0], y: d[1]};
      })
      .style($.extend({
        strokeColor: 'blue',
        strokeWidth: 8,
        strokeOpacity: 1
      }, baseStyle));

    myMap.draw();

    imageTest.imageTest('webglLinesOpts', null, 0.0015, done, myMap.onIdle, 0, 2);

  }, 30000);
});