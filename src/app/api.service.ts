import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { delay, map } from "rxjs/operators";
import { Observable } from "rxjs";
import { IComments } from "./interfaces";

export interface IData<T> {
  [key: string]: T;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(private http: HttpClient) { }

  // Загружаем с задержкой массив из файла, имитируя загрузку с сервера
  public getCommentsArray(): Observable<IComments[]> {
    return this.http.get<IData<IComments[]>>('assets/comments.json')
      .pipe(
        delay(1000),
        map((response: IData<IComments[]>) => response.comments)
      );
  }
}
