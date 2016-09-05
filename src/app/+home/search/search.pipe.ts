import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'appSearch'
})
export class SearchPipe implements PipeTransform {
  
  transform(value: any, placesMeta: any, term?, type?, location?, filteredMeta?, lastUpdated?): any {
    let queries: Array<string> = [];
    if (value === undefined) { return; }
    if (term === '' && type === 'all' && location === 'all') {
      filteredMeta.count = -1; // filter not active 
      return value;
    }
    if (term.length) {
      // Treat each word as a query and normalize to lowercase
      let rawQueries: Array<string> = term.toLowerCase().split( ' ' );
      // Remove stop words
      queries = this.removeStopWords( rawQueries );
    }
    let filtered = [];
    filtered = value.filter((item) => {
      // Type filter  
      if (type !== 'all'
        // if types have not yet been added, then do not filter out item
        && placesMeta[item].types.length > 0
        && placesMeta[item].types.indexOf(type) === -1) {
        return;
      }
      // Location filter
      if (location !== 'all'
        // if location has not yet been added, then do not filter out item
        && 'location' in placesMeta[item]
        && placesMeta[item].location !== location) {
        return;
      }
      if (term.length) {
        let searchable: string; // this string contains searchable text
        // add name to searchable text
        searchable = placesMeta[item].name;
        // add types to searchable text
        if ('typesArray' in placesMeta[item]) {
          let types = placesMeta[item].typesArray;
          for (let i = 0; i < types.length; i++) {
            searchable += ' ' + types[i];
          } 
        }
        // add location to searchable text
        if ('location' in placesMeta[item]) {
          searchable += ' ' + placesMeta[item].location;
        }
        // Add reviews to searchable text
        if ('reviews' in placesMeta[item] && placesMeta[item].reviews !== undefined) {
          let reviews = placesMeta[item].reviews;
          for (let i = 0; i < reviews.length; i++) {
            if ('text' in reviews[i]) {
              searchable += ' ' + reviews[i].text;
            }
          } 
        }
        // Normalize text to lowercase
        searchable = searchable.toLowerCase();
        for (let i = 0 ; i < queries.length; i++) {
            if (searchable.indexOf( queries[i] ) === -1) { return false; }
        }
      }
      return item;
    });
    filteredMeta.count = filtered.length;
    filteredMeta.query = this.readableQueries([term, type, location]);
    return filtered;
  }

  private readableQueries(filterValues: Array<string>): string {
    let filterReadable: string = '';
    let filteredArray = [];
    let defaults = ['', 'all'];
    for (let i = 0 ; i < filterValues.length; i++) {
      if (defaults.indexOf( filterValues[i] ) === -1) {
        filteredArray.push( filterValues[i] );
      }
    }
    for (let i = 0; i < filteredArray.length; i++) {
      if (i === 0) {
        filterReadable = '"' + filteredArray[i] + '"';
      } else if (filteredArray.length === i + 1) {
        filterReadable += ', and "' + filteredArray[i] + '"';
      } else {
        filterReadable += ', "' + filteredArray[i] + '"';
      }
    }
    return filterReadable;
  }

  private removeStopWords(queries: Array<string>): Array<string> {
    return queries.filter((item) => {
      return this.stopWords().indexOf(item) === -1;
    });
  }

  private stopWords(): Array<string> {
    // Thanks!: http://geeklad.com/remove-stop-words-in-javascript
    return [
      'a',
      'about',
      'above',
      'across',
      'after',
      'again',
      'against',
      'all',
      'almost',
      'alone',
      'along',
      'already',
      'also',
      'although',
      'always',
      'among',
      'an',
      'and',
      'another',
      'any',
      'anybody',
      'anyone',
      'anything',
      'anywhere',
      'are',
      'area',
      'areas',
      'around',
      'as',
      'ask',
      'asked',
      'asking',
      'asks',
      'at',
      'away',
      'b',
      'back',
      'backed',
      'backing',
      'backs',
      'be',
      'became',
      'because',
      'become',
      'becomes',
      'been',
      'before',
      'began',
      'behind',
      'being',
      'beings',
      'best',
      'better',
      'between',
      'big',
      'both',
      'but',
      'by',
      'c',
      'came',
      'can',
      'cannot',
      'case',
      'cases',
      'certain',
      'certainly',
      'clear',
      'clearly',
      'come',
      'could',
      'd',
      'did',
      'differ',
      'different',
      'differently',
      'do',
      'does',
      'done',
      'down',
      'down',
      'downed',
      'downing',
      'downs',
      'during',
      'e',
      'each',
      'early',
      'either',
      'end',
      'ended',
      'ending',
      'ends',
      'enough',
      'even',
      'evenly',
      'ever',
      'every',
      'everybody',
      'everyone',
      'everything',
      'everywhere',
      'f',
      'face',
      'faces',
      'fact',
      'facts',
      'far',
      'felt',
      'few',
      'find',
      'finds',
      'first',
      'for',
      'four',
      'from',
      'full',
      'fully',
      'further',
      'furthered',
      'furthering',
      'furthers',
      'g',
      'gave',
      'general',
      'generally',
      'get',
      'gets',
      'give',
      'given',
      'gives',
      'go',
      'going',
      'good',
      'goods',
      'got',
      'great',
      'greater',
      'greatest',
      'group',
      'grouped',
      'grouping',
      'groups',
      'h',
      'had',
      'has',
      'have',
      'having',
      'he',
      'her',
      'here',
      'herself',
      'high',
      'high',
      'high',
      'higher',
      'highest',
      'him',
      'himself',
      'his',
      'how',
      'however',
      'i',
      'if',
      'important',
      'in',
      'interest',
      'interested',
      'interesting',
      'interests',
      'into',
      'is',
      'it',
      'its',
      'itself',
      'j',
      'just',
      'k',
      'keep',
      'keeps',
      'kind',
      'knew',
      'know',
      'known',
      'knows',
      'l',
      'large',
      'largely',
      'last',
      'later',
      'latest',
      'least',
      'less',
      'let',
      'lets',
      'like',
      'likely',
      'long',
      'longer',
      'longest',
      'm',
      'made',
      'make',
      'making',
      'man',
      'many',
      'may',
      'me',
      'member',
      'members',
      'men',
      'might',
      'more',
      'most',
      'mostly',
      'mr',
      'mrs',
      'much',
      'must',
      'my',
      'myself',
      'n',
      'necessary',
      'need',
      'needed',
      'needing',
      'needs',
      'never',
      'new',
      'new',
      'newer',
      'newest',
      'next',
      'no',
      'nobody',
      'non',
      'noone',
      'not',
      'nothing',
      'now',
      'nowhere',
      'number',
      'numbers',
      'o',
      'of',
      'off',
      'often',
      'old',
      'older',
      'oldest',
      'on',
      'once',
      'one',
      'only',
      'open',
      'opened',
      'opening',
      'opens',
      'or',
      'order',
      'ordered',
      'ordering',
      'orders',
      'other',
      'others',
      'our',
      'out',
      'over',
      'p',
      'part',
      'parted',
      'parting',
      'parts',
      'per',
      'perhaps',
      'place',
      'places',
      'point',
      'pointed',
      'pointing',
      'points',
      'possible',
      'present',
      'presented',
      'presenting',
      'presents',
      'problem',
      'problems',
      'put',
      'puts',
      'q',
      'quite',
      'r',
      'rather',
      'really',
      'right',
      'right',
      'room',
      'rooms',
      's',
      'said',
      'same',
      'saw',
      'say',
      'says',
      'second',
      'seconds',
      'see',
      'seem',
      'seemed',
      'seeming',
      'seems',
      'sees',
      'several',
      'shall',
      'she',
      'should',
      'show',
      'showed',
      'showing',
      'shows',
      'side',
      'sides',
      'since',
      'small',
      'smaller',
      'smallest',
      'so',
      'some',
      'somebody',
      'someone',
      'something',
      'somewhere',
      'state',
      'states',
      'still',
      'still',
      'such',
      'sure',
      't',
      'take',
      'taken',
      'than',
      'that',
      'the',
      'their',
      'them',
      'then',
      'there',
      'therefore',
      'these',
      'they',
      'thing',
      'things',
      'think',
      'thinks',
      'this',
      'those',
      'though',
      'thought',
      'thoughts',
      'three',
      'through',
      'thus',
      'to',
      'today',
      'together',
      'too',
      'took',
      'toward',
      'turn',
      'turned',
      'turning',
      'turns',
      'two',
      'u',
      'under',
      'until',
      'up',
      'upon',
      'us',
      'use',
      'used',
      'uses',
      'v',
      'very',
      'w',
      'want',
      'wanted',
      'wanting',
      'wants',
      'was',
      'way',
      'ways',
      'we',
      'well',
      'wells',
      'went',
      'were',
      'what',
      'when',
      'where',
      'whether',
      'which',
      'while',
      'who',
      'whole',
      'whose',
      'why',
      'will',
      'with',
      'within',
      'without',
      'work',
      'worked',
      'working',
      'works',
      'would',
      'x',
      'y',
      'year',
      'years',
      'yet',
      'you',
      'young',
      'younger',
      'youngest',
      'your',
      'yours',
      'z'
    ];
  }

}
