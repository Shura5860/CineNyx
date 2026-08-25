import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FilmService {
  
  private apiUrl = 'http://localhost:3000/api/filmler';

  constructor(private http: HttpClient) { }

  getFilm(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  getAllFilms(): Observable<any> {
    return this.http.get(this.apiUrl);
  }
}
