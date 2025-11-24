import { base } from '$app/paths';
export const introHtmlBase = `
Er zijn door de jaren heen heel veel mooie, lieve, leuke of grappige liedjes geschreven over ons bijzondere land.<br>
Deze liedjeskaart biedt een interactief overzicht van {COUNT} liedjes over plekken en plaatsen in Nederland.<br><br>

<b>Focus</b><br>
Mijn focus ligt op theater- en kleinkunstliederen, omdat we daar een rijke traditie in hebben die wat mij betreft best wat vaker onder de aandacht gebracht mag worden.
Maar ook onder andere hiphop, popmuziek, smartlappen en hier en daar een verdwaalde carnavalskraker hebben hun plekje op de kaart gevonden.  
<br><br>

<b>Contact</b><br>
Heb ik een obscuur lied over een verborgen plek over het hoofd gezien?
Wil je me gewoon even vertellen dat je heel van me houdt?
Of heb je een gaaf idee voor een samenwerking?<br><br>

Stuur me een mailtje op <a href="mailto:post@woutervanitterzon.nl">post@woutervanitterzon.nl</a>.<br><br>

Ik ben ook best leuk op
<a href="https://www.instagram.com/zonderkonijn/" target="_blank" rel="noopener noreferrer">instagram</a>.
<br><br>

Liefs,<br><br>
Wouter
`;

export const extraHtmlBase = `
<b>Technisch</b><br>
De liedjeskaart is in elkaar geknutseld in HTML, CSS en TypeScript binnen het
<a href="https://svelte.dev/" target="_blank">SvelteKit</a>-framework.
De kaartlaag komt van <a href="https://www.maptiler.com/" target="_blank">MapTiler</a>.
<br><br>

Om zicht te houden op bezoekersgedrag zonder tegen privacyvraagstukken aan te lopen maak ik gebruik van <a target="_blank"  rel="noopener noreferrer" href="https://www.simpleanalytics.com/">Simple Analytics</a>.
<br><br>

<b>Bronnen</b><br>
            Doordat mijn prachtige ouders Erik en Irene me fantastisch hebben opgevoed kende ik veel van de liedjes al. De rest heb ik gewoon opgezocht met google. 
            Daarbij bleken welkome bronnen bijvoorbeeld dit uitgebreide <a  rel="noopener noreferrer" href="https://nl.wikisage.org/wiki/Lijst_van_Nederlandstalige_liedjes_met_een_geografische_naam_in_de_titel target="_blank">wikisage overzicht</a>, het <a href="https://poparchiefgroningen.nl/"  rel="noopener noreferrer" target="_blank">Poparchief Groningen</a> en de hele gave en complete website <a target="_blank"  rel="noopener noreferrer" href="https://www.streektaalzang.nl/">Sttreektaalzang.nl</a>.
            <br><br>
<br>
          <img src="${base}/img/erikenirene.jpg" alt="Mijn ouders" class="content-img" >
          <p class="caption">Erik en Irene</p>
<br>
<b>Verdere dank</b><br>
Mijn voormalige geliefde Suzanne heeft me geholpen met een stukje gebruikerstesten en wat extra enthousiasme. 
<br><br>    
Hoewel ik om allerlei uiteenlopende redenen hartstikke AI sceptisch ben heb ik voor dit project ook chatGPT als klankbord gebruikt. Dat ging af en toe heel goed en zorgde af en toe voor flink wat extra hoofdpijn. Het was in ieder geval steeds een interessante ervaring.
<br><br>
M’n kat Jop heeft me geholpen door de liefste kat van Tilburg te zijn maar ook <i>ongeholpen</i> door af en toe luid miauwend op m’n bureau te komen staan.
<br><br>
          <img src="${base}/img/jop.jpg" alt="Mijn kat Jop" class="content-img" >
          <p class="caption">Jop. Bijna even fotogeniek als z’n baasje.</p>
`;
