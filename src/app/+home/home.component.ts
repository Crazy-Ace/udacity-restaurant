import { Component, OnInit } from '@angular/core';

import { PlacesService } from '../shared/index';

@Component({
  selector: 'app-home',
  templateUrl: 'home.component.html',
  styleUrls: ['home.component.scss']
})
export class HomeComponent implements OnInit {
  public isCollapsed: boolean = true;
  constructor(public places: PlacesService) { }

  ngOnInit() {
  }

}
