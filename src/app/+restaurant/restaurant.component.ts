import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Validators } from '@angular/forms';

import { PlacesService } from '../shared/index';

@Component({
  selector: 'app-restaurant',
  templateUrl: './restaurant.component.html',
  styleUrls: ['./restaurant.component.scss']
})
export class RestaurantComponent implements OnInit {
  public restaurantId: string;
  public showMore: boolean = false;
  public formInfo: any = {
    review: {
      title: '',
      instructions: '',
      fields: [
        {
          name: 'Name',
          type: 'input',
          inputType: 'text',
          control: ['', Validators.required],
          mode: 'signup'
        },
        {
          name: 'Comments',
          type: 'textarea',
          control: ['']
        },
        {
          type: 'submit',
          text: 'Next'
        }
      ]
    }
  };
  constructor(public places: PlacesService,
    private activatedRoute: ActivatedRoute) { }

  ngOnInit() {
    this.restaurantId = this.activatedRoute.snapshot.url[1].path;
    this.places.requestPlace( this.restaurantId );
  }

  onSubmit(event) {
    console.log('form submitted', event);
  }

}
