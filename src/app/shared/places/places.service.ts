import { Injectable, ApplicationRef } from '@angular/core';
import { Http, Response } from '@angular/http';
import { URLSearchParams } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { MapsAPILoader } from 'angular2-google-maps/core';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/publishLast';
import * as moment from 'moment';
declare let google: any;

@Injectable()
export class PlacesService {
  public places = [];
  public placesMeta = {};
  public cuisineTypes = [
    'Barbecue',
    'Fast food',
    'Pizza',
    'Sandwiches',
    'Seafood',
    'Steakhouses'
  ];
  public ethnicities = [
    'Chinese',
    'Greek',
    'Italian',
    'Japanese',
    'Mexican',
    'Thai'
  ];
  public lastUpdated: number;
  public updating: boolean = false;
  public locations = [];
  private rateLimit: number = 500; // Only create a request every x miliseconds
  private timeoutWait: number = 0;
  private queries = {};

  constructor(
    private http: Http,
    private mapsApiLoader: MapsAPILoader,
    private applicationRef: ApplicationRef) {
  }

  /**
   * Loads Google Places from api
   */
  public loadPlaces(): void {
    this.getCordinates().subscribe( data => {
      this.searchPlaces(data.location);
    });
  }

  /**
   * Returns an Observable for the HTTP GET request for the JSON resource.
   * @return {any} The Observable for the HTTP request.
   */
  private getCordinates(): Observable<any> {
    let url: string = 'https://geoip.nekudo.com/api';
    return this.http.get( url )
      .map((res: Response) => res.json())
      .publishLast().refCount()
      .catch(this.handleError);
  }

  /**
    * Handle HTTP error
    */
  private handleError (error: any): Observable<any> {
    let errMsg = (error.message) ? error.message :
      error.status ? `${error.status} - ${error.statusText}` : 'Server error';
    console.error(errMsg); // log to console
    return Observable.throw(errMsg);
  }

  private searchPlaces(location): void {
    // Load Google Maps library
    this.mapsApiLoader.load().then(() => {
      let pyrmont = new google.maps.LatLng(location.latitude, location.longitude);
      let mapElement = document.createElement('div');
      let map = new google.maps.Map(mapElement, {
        center: pyrmont,
        zoom: 15
      });
      let service = new google.maps.places.PlacesService(map);
      // Add queries
      this.addQueries( this.cuisineTypes );
      this.addQueries( this.ethnicities );
      // It was nessiary to make multiple `textSearch` api
      // calls to get types => http://stackoverflow.com/a/17850358/5357459
      for (let query in this.queries) {
        if (this.queries.hasOwnProperty(query)) {
          setTimeout( () => {
            let request = {
              location: pyrmont,
              radius: '8000',
              query: query,
              types: ['restaurant']
            };
            // Request nearby restaurants
            service.textSearch(request, (results, status) => {
              this.queries[query] = true;
              if (status === 'OK') {
                // Loop through nearby restaurants
                for (let i = 0; i < results.length; i++) {
                  if ('photos' in results[i]) {
                    let id = results[i].place_id;
                    if (id in this.placesMeta) {
                      // If place was already added from another query,
                      // then just add this query to the types array
                      this.placesMeta[id].typesArray.push(query);
                    } else {
                      this.places.push( id );
                      this.placesMeta[id] = {
                        name: results[i].name,
                        detailsAdded: false,
                        hours: [],
                        phone: null,
                        photo: results[i].photos[0].getUrl({'maxWidth': 1000, 'maxHeight': 1000}),
                        rating: results[i].rating,
                        reviews: [],
                        typesArray: [query],
                        types: '',
                        vicinity: '',
                        website: null
                      } 
                    }     
                  }
                }
              }
              if (this.queriesComplete()) {
                this.defaultSort();
                this.getDetails(service);
              }
            });
            this.applicationRef.tick() ;
          }, this.timeoutWait);
          this.timeoutWait += this.rateLimit;
        }
      }
    });
  }

  private addQueries(queries): void {
    for (let i = 0; i < queries.length; i++) {
      this.queries[ queries[i] ] = false;
    }
  }

  private queriesToString(input: Array<string>): string {
    let queryString: string = '';
    for (let i = 0; i < input.length; i++) {
      queryString += input[i];
      if (i + 1 !== input.length) { queryString += ', '; }
    }
    return queryString;
  }

  private queriesComplete(): boolean {
    for (let query in this.queries) {
      if (this.queries.hasOwnProperty(query)) {
        if (!this.queries[query]) {
          return false;
        }
      }
    }
    return true;
  }

  private defaultSort(): void {
    this.places = this.places.sort( (a, b) => {
      return this.placesMeta[b].rating - this.placesMeta[a].rating;
    });
  }

  private getDetails(service): void {
    this.timeoutWait = 0;
    for (let i = 0; i < this.places.length; i++) {
      let place_id = this.places[i];
      if (this.placesMeta.hasOwnProperty(place_id)) {
        let qString: string = this.queriesToString( this.placesMeta[place_id].typesArray );
        this.placesMeta[place_id].types = qString;
        let request = {
          placeId: place_id
        };
        setTimeout( () => {
          service.getDetails(request, (result, status) => {
            if (status === 'OK') {
              if ('opening_hours' in result && 'periods' in result.opening_hours) {
                this.placesMeta[result.place_id].hours
                  = this.hoursToArray(result.opening_hours);
              }
              this.placesMeta[result.place_id].phone = result.formatted_phone_number;
              this.placesMeta[result.place_id].reviews = result.reviews;
              this.placesMeta[result.place_id].vicinity = result.vicinity;
              this.placesMeta[result.place_id].website = result.website;
              // Add city to location array
              for (let n = 0; n < result.address_components.length; n++) {
                if (result.address_components[n].types.indexOf('locality') !== -1 ) {
                  let thisLocation = result.address_components[n].long_name;
                  this.placesMeta[result.place_id].location = thisLocation;
                  if (this.locations.indexOf(thisLocation) === -1) {
                    this.locations.push( thisLocation );
                  }
                }
              }
            } else {
              console.warn('Couldn\'t get details. Returned status: ' + status);
            }
            this.triggerUpdate();
          });
          this.applicationRef.tick() ;
        }, this.timeoutWait);
        this.timeoutWait += this.rateLimit;
      }
    }
  }

  private triggerUpdate(): void {
    // Throttle pipe updates
    if (!this.updating) {
      this.updating = true;
      setTimeout( () => {
        this.lastUpdated = new Date().getTime();
        this.updating = false;
      }, 1000);
    }
  }

  private formatTime(input: string): string {
    // Remove spaces, use lowercase
    let formated: string = input.split(' ').join('').toLowerCase();
    // Add space for comma
    return formated.split(',').join(', ');
  }

  private hoursToArray(input?): Array<string> {
    if (input.periods.length === 1) { return ['24 hours']; } 
    let days = [];
    for (let i = 0; i < input.weekday_text.length; i++) {
      let index = i + 1;
      if (i === 6) { index = 0; }
      days[index] = this.formatTime( input.weekday_text[i].split(': ')[1] );
    }
    let output = [];
    // Merge duplicate days
    let lastDay: string = days[0];
    let firstInPattern: number = 0;
    for (let i = 1; i < days.length; i++) {
      if (days[i] !== lastDay) {
        // Convert last to string
        let dayString = this.daysToString(firstInPattern, i-1);
        output.push( dayString + days[i-1] );
        lastDay = days[i];
        firstInPattern = i;
      }
    }
    let dayString = this.daysToString(firstInPattern, 6);
    output.push( dayString + days[6] );
    return output;
  }

  private daysToString(firstDay: number, lastDay: number): string {
    if (firstDay === 0 && lastDay === 6) { return 'Everyday '}
    let firstM = moment().day(firstDay);
    let lastM =  moment().day(lastDay);
    let multipleDayString: string = '';
    // If hours are for multiple days
    if (firstDay !== lastDay) { multipleDayString =  '-' + lastM.format('ddd') }
    return firstM.format('ddd') + multipleDayString + ' ';
  }

}
