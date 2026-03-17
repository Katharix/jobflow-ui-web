import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './not-found.component.html',
  styleUrl: './not-found.component.scss',
})
export class NotFoundComponent implements OnInit {

      type: string | null;
  title: string;
  descLines: string[] = [];

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.type = this.route.snapshot.paramMap.get('type');
    
    switch(this.type) {
      case '404':
        this.title = 'Page Not Found';
        this.descLines = ['Oopps!! The page you were looking for doesn\'t exist.'];
        break;
      case '500':
        this.title = 'Internal Server Error';
        this.descLines = ['Oopps!! There was an error. Please try again later.'];
        break;
      default:
        this.type = 'Ooops..';
        this.title = 'Something went wrong';
        this.descLines = ['Looks like something went wrong.', 'We\'re working on it'];
    }
  }
}
